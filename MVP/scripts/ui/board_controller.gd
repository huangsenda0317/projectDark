class_name BoardController
extends Control

## Circular board controller — renders tiles in a ring, manages player movement,
## dice rolling flow, direction selection, and lap tracking.

enum State { IDLE, ROLLING, MOVING, TRIGGERING, SHOPPING, EVENT, TREASURE, COMBAT }

var state: State = State.IDLE
var board_generator: BoardGenerator
var dice_system: DiceSystem
var enemy_loader: EnemyLoader
var tiles: Array = []            # Array of TileComponent instances
var current_tile_index: int = 0
var lap_start_index: int = 0
var pending_steps: int = 0
var tile_scene: PackedScene = preload("res://scenes/board/tile.tscn")

@onready var board_ring: Control = $"."
@onready var board_hud: BoardHUD = $"../BoardHUD"
@onready var dice_panel: DicePanel = $"../DicePanel"
@onready var move_dice_selector: MoveDiceSelector = $"../MoveDiceSelector"
@onready var shop_panel: ShopPanel = $"../ShopPanel"
@onready var event_panel: EventPanel = $"../EventPanel"
@onready var treasure_panel: TreasurePanel = $"../TreasurePanel"
@onready var combat_panel: Control = $"../CombatPanel"
@onready var attr_panel: AttrPanel = $"../AttrPanel"
var player_token: ColorRect


func _ready() -> void:
	board_generator = BoardGenerator.new()
	dice_system = DiceSystem.new()

	EventBus.tile_stepped.connect(_on_tile_clicked)
	EventBus.tiles_reveal_requested.connect(_on_reveal_tiles)
	EventBus.lantern_used.connect(_on_lantern_used)
	move_dice_selector.roll_complete.connect(_on_roll_complete)
	shop_panel.shop_closed.connect(_on_panel_closed)
	event_panel.event_resolved.connect(_on_panel_closed)
	treasure_panel.treasure_resolved.connect(_on_panel_closed)
	attr_panel.attr_panel_closed.connect(_on_panel_closed)
	EventBus.level_up.connect(_on_level_up)

	enemy_loader = EnemyLoader.new()
	add_child(enemy_loader)

	_generate_floor()

	if not player_token:
		player_token = ColorRect.new()
		player_token.size = Vector2(16, 16)
		player_token.color = Color(0.1, 0.9, 0.1)
		board_ring.add_child(player_token)

	_place_player(0, true)
	_snap_player_token()
	board_hud.refresh()


func _generate_floor() -> void:
	_clear_tiles()

	var floor = GameState.current_floor
	if floor == 0:
		floor = 1
		GameState.current_floor = 1

	var tower_level = GameState.current_tower.tower_level if GameState.current_tower else 1
	var tile_data_list = board_generator.generate_floor(floor, tower_level)

	var radius = _calculate_radius(tile_data_list.size())

	for i in tile_data_list.size():
		var td = tile_data_list[i]
		var tile = tile_scene.instantiate()
		var comp = tile as TileComponent
		board_ring.add_child(tile)

		var angle = _tile_angle(i, tile_data_list.size())
		comp.setup(td, i)
		comp.angle = angle
		comp.position = _polar_to_position(angle, radius) - comp.size * 0.5
		tiles.append(comp)

	current_tile_index = 0
	lap_start_index = 0
	_reveal_tile_at(current_tile_index)
	_apply_floor_start_affixes()

	EventBus.board_generated.emit(tiles.size())
	EventBus.floor_entered.emit(GameState.current_floor)
	move_dice_selector.refresh()


func _clear_tiles() -> void:
	for t in tiles:
		if is_instance_valid(t):
			t.queue_free()
	tiles.clear()


func _tile_angle(index: int, total: int) -> float:
	return (float(index) / float(total)) * TAU - PI * 0.5


func _polar_to_position(angle: float, radius: float) -> Vector2:
	var cx = board_ring.size.x * 0.5
	var cy = board_ring.size.y * 0.5
	return Vector2(cx + cos(angle) * radius, cy + sin(angle) * radius)


func _calculate_radius(tile_count: int) -> float:
	var circumference = tile_count * 52.0
	return maxi(60.0, circumference / TAU)


func _place_player(index: int, instant: bool = false) -> void:
	if current_tile_index >= 0 and current_tile_index < tiles.size():
		tiles[current_tile_index].set_player_here(false)
	current_tile_index = clampi(index, 0, tiles.size() - 1)
	tiles[current_tile_index].set_player_here(true)
	GameState.current_tile_index = current_tile_index
	_snap_player_token()


func _snap_player_token() -> void:
	if current_tile_index < 0 or current_tile_index >= tiles.size():
		return
	var target = tiles[current_tile_index]
	player_token.position = target.position + target.size * 0.5 - player_token.size * 0.5


func _reveal_tile_at(index: int) -> void:
	if index < 0 or index >= tiles.size():
		return
	tiles[index].reveal()
	board_generator.reveal_tile(index)


func _trigger_tile_at(index: int) -> void:
	if index < 0 or index >= tiles.size():
		return
	var td = board_generator.get_tile_at(index)
	if td == null:
		return

	if td.tile_type == "stair":
		_advance_floor()
		return

	# Mark as triggered
	td.is_triggered = true
	tiles[index].mark_triggered()
	EventBus.tile_triggered.emit(td.tile_type, td.get_trigger_data())

	match td.tile_type:
		"combat":
			state = State.COMBAT
			var total_floors = GameState.total_floors_in_tower
			var is_last = (GameState.current_floor >= total_floors)
			var enemy = enemy_loader.get_enemy_for_floor(GameState.current_floor, is_last)
			_start_combat(enemy)
		"event":
			state = State.EVENT
			event_panel.open_event()
		"shop":
			state = State.SHOPPING
			shop_panel.open_shop()
		"prayer":
			var faith_gain = RNG.randi_range(2, 4)
			GameState.add_faith(faith_gain)
			board_hud.show_toast("祈祷所 +%d 信仰" % faith_gain)
		"treasure":
			state = State.TREASURE
			treasure_panel.open_treasure()
		"trap":
			var dmg = RNG.randi_range(3, 8)
			GameState.take_damage(dmg)
			board_hud.show_toast("陷阱! -%d HP" % dmg)
		"boss":
			state = State.COMBAT
			var boss_enemy = enemy_loader.get_enemy_for_floor(GameState.current_floor, true)
			_start_combat(boss_enemy)

	SaveManager.auto_save()


func _try_drop_dice(current_floor: int, _tower_level: int) -> void:
	var dice = dice_system.generate_dice(current_floor, 1)
	if GameState.add_dice(dice):
		print("[M2] 获得骰子: D%d %s" % [dice.face_count, dice.quality_to_chinese()])
		board_hud.refresh()
	else:
		print("[M2] 骰子匣已满, 无法拾取 D%d %s" % [dice.face_count, dice.quality_to_chinese()])


func _apply_floor_start_affixes() -> void:
	for dice in GameState.get_all_dice():
		for affix in dice.get_affixes_by_type("universal"):
			if affix.affix_name == "治愈之光":
				var heal = affix.effect_data.get("floor_heal", 3)
				GameState.heal(heal)
				print("[M2] 治愈之光: +%d HP" % heal)


func _advance_floor() -> void:
	GameState.current_floor += 1
	if GameState.current_floor > GameState.total_floors_in_tower:
		EventBus.run_ended.emit()
		get_tree().change_scene_to_file("res://scenes/village/village.tscn")
		return

	const WEAR_RECOVERY := 2
	for dice in GameState.get_all_dice():
		if not dice.is_shattered:
			dice.reduce_wear(WEAR_RECOVERY)

	_generate_floor()
	board_hud.refresh()


## -- Dice rolling flow --

func _on_roll_requested() -> void:
	if state != State.IDLE:
		return
	GameState.unlock_allocation()
	state = State.ROLLING
	move_dice_selector.refresh()


func _on_roll_complete(steps: int, _raw: int, _bonuses: Array, direction: int) -> void:
	pending_steps = steps
	state = State.MOVING
	_show_direction_indicators(direction, steps)
	var target = _calculate_target_index(direction, pending_steps)
	_animate_movement(target)


func _show_direction_indicators(direction: int, steps: int) -> void:
	var target = _calculate_target_index(direction, steps)
	var is_cw = (direction == 0)
	for i in tiles.size():
		if i == target:
			tiles[i].set_direction_indicator(true, is_cw)


func _clear_direction_indicators() -> void:
	for t in tiles:
		t.clear_indicators()


func _calculate_target_index(direction: int, steps: int) -> int:
	if direction == 0:
		return (current_tile_index + steps) % tiles.size()
	else:
		return (current_tile_index - steps + tiles.size()) % tiles.size()


## -- Movement animation --

func _animate_movement(target_index: int) -> void:
	var path = _build_path(current_tile_index, target_index)
	_animate_step(path, 0)


func _build_path(from_idx: int, to_idx: int) -> Array:
	var cw_dist = (to_idx - from_idx + tiles.size()) % tiles.size()
	var ccw_dist = (from_idx - to_idx + tiles.size()) % tiles.size()

	var path: Array = []
	if cw_dist <= ccw_dist:
		for i in range(1, cw_dist + 1):
			path.append((from_idx + i) % tiles.size())
	else:
		for i in range(1, ccw_dist + 1):
			path.append((from_idx - i + tiles.size()) % tiles.size())
	return path


func _animate_step(path: Array, step: int) -> void:
	if step >= path.size():
		_on_movement_complete()
		return

	var next_idx = path[step]
	_place_player(next_idx)
	_check_lap(current_tile_index)

	var tween = create_tween()
	tween.tween_interval(0.12)
	tween.tween_callback(_animate_step.bind(path, step + 1))


func _on_movement_complete() -> void:
	_reveal_tile_at(current_tile_index)

	if _is_death_drop_tile():
		if GameState.death_gold_dropped > 0 or GameState.death_equipment_dropped != null:
			print("[M3] Found death drop!")
			GameState.gold += GameState.death_gold_dropped
			var eq = GameState.death_equipment_dropped
			if eq:
				board_hud.show_toast("Recovered: %s" % eq.item_name)
			GameState.death_gold_dropped = 0
			GameState.death_equipment_dropped = null
			GameState.death_location.clear()

	_clear_direction_indicators()
	state = State.TRIGGERING
	_trigger_tile_at(current_tile_index)
	# Panel-opening tiles (shop/event/treasure) change state away from TRIGGERING;
	# non-panel tiles leave it at TRIGGERING.
	if state == State.TRIGGERING:
		state = State.IDLE
	board_hud.refresh()
	move_dice_selector.enable_roll()


## -- Lap detection --

func _check_lap(new_index: int) -> void:
	var old = current_tile_index
	var total = tiles.size()
	var cw_dist = (new_index - old + total) % total
	var ccw_dist = (old - new_index + total) % total

	if cw_dist == 0:
		return

	var crossed := false
	if cw_dist <= ccw_dist:
		var i = (old + 1) % total
		while i != (new_index + 1) % total:
			if i == lap_start_index:
				crossed = true
				break
			i = (i + 1) % total
	else:
		var i = (old - 1 + total) % total
		while i != (new_index - 1 + total) % total:
			if i == lap_start_index:
				crossed = true
				break
			i = (i - 1 + total) % total

	if crossed:
		_on_lap_completed()


func _on_lap_completed() -> void:
	for i in tiles.size():
		var td = board_generator.get_tile_at(i)
		if td and td.is_triggered and td.tile_type != "void":
			board_generator.convert_to_void(i)
			tiles[i].mark_triggered()

	GameState.add_curse(1)
	lap_start_index = current_tile_index
	EventBus.lap_completed.emit(GameState.curse_level)
	print("[M2] 完成一圈! 诅咒 +1 (当前: %d)" % GameState.curse_level)


## -- Tile click --

func _on_tile_clicked(tile_index: int, _tile_type: String) -> void:
	if state != State.IDLE:
		return
	var dist = mini(
		(tile_index - current_tile_index + tiles.size()) % tiles.size(),
		(current_tile_index - tile_index + tiles.size()) % tiles.size()
	)
	if dist <= 0:
		return
	print("[M2] 点击格子 %d (距离: %d)" % [tile_index, dist])


## -- Dice panel access --

func _on_dice_panel_toggle() -> void:
	if dice_panel.visible:
		dice_panel.hide()
	else:
		dice_panel.refresh()
		dice_panel.show()


## -- Panel event handlers --

func _on_panel_closed() -> void:
	state = State.IDLE
	board_hud.refresh()
	move_dice_selector.refresh()


func _on_level_up(_new_level: int) -> void:
	attr_panel.open_panel()


## -- Combat --

func _start_combat(enemy: EnemyData) -> void:
	var combat_scene = preload("res://scenes/combat/combat.tscn")
	var instance = combat_scene.instantiate()
	combat_panel.add_child(instance)
	var manager = instance as CombatManager
	manager.combat_finished.connect(_on_combat_finished.bind(instance))
	manager.start(enemy)
	combat_panel.show()


func _on_combat_finished(victory: bool, rewards: Dictionary, instance: Control) -> void:
	if victory:
		GameState.gain_exp(rewards.get("exp", 0))
		GameState.add_gold(rewards.get("gold", 0))
		if rewards.get("dice_dropped", false):
			_try_drop_dice(GameState.current_floor, 1)
		if rewards.get("boss_defeated", false):
			_on_boss_defeated(rewards)
		board_hud.show_toast("战斗胜利！+%d 经验 +%d 金币" % [rewards.get("exp", 0), rewards.get("gold", 0)])
	elif rewards.get("fled", false):
		board_hud.show_toast("成功逃离!")
	else:
		board_hud.show_toast("战败...返回村庄")
		instance.queue_free()
		combat_panel.hide()
		SaveManager.auto_save()
		await get_tree().create_timer(2.0).timeout
		get_tree().change_scene_to_file("res://scenes/village/village.tscn")
		return

	instance.queue_free()
	combat_panel.hide()
	state = State.IDLE
	board_hud.refresh()
	move_dice_selector.refresh()
	SaveManager.auto_save()


func _on_boss_defeated(_rewards: Dictionary) -> void:
	# Generate blue quality dice from boss drop
	var dice = dice_system.generate_dice(GameState.current_floor, GameState.current_tower.tower_level if GameState.current_tower else 1)
	dice.quality = "blue"
	if GameState.add_dice(dice):
		board_hud.show_toast("BOSS掉落: D%d %s骰子!" % [dice.face_count, "蓝"])
	else:
		board_hud.show_toast("骰子匣已满, 蓝骰无法拾取!")
	if _rewards.get("dice_box_expansion", false):
		if GameState.expand_dice_box():
			board_hud.show_toast("骰子匣扩容! 容量 %d" % GameState.dice_box_capacity)


func _is_death_drop_tile() -> bool:
	var loc = GameState.death_location
	if loc.is_empty():
		return false
	if loc.get("tower_id", "") != GameState.current_tower_id:
		return false
	if loc.get("floor", -1) != GameState.current_floor:
		return false
	return loc.get("tile_index", -1) == current_tile_index


func _on_reveal_tiles(count: int) -> void:
	var revealed := 0
	var idx = (current_tile_index + 1) % tiles.size()
	while revealed < count and idx != current_tile_index:
		var td = board_generator.get_tile_at(idx)
		if td and not td.is_revealed:
			_reveal_tile_at(idx)
			revealed += 1
		idx = (idx + 1) % tiles.size()
	board_hud.show_toast("揭示了 %d 个前方格子" % revealed)


func _on_lantern_used() -> void:
	var stair_idx = -1
	for i in tiles.size():
		var td = board_generator.get_tile_at(i)
		if td and td.tile_type == "stair":
			stair_idx = i
			break
	if stair_idx < 0:
		board_hud.show_toast("灯笼未发现上楼格...")
		return
	var cw_dist = (stair_idx - current_tile_index + tiles.size()) % tiles.size()
	var ccw_dist = (current_tile_index - stair_idx + tiles.size()) % tiles.size()
	if cw_dist <= ccw_dist:
		board_hud.show_toast("🏮 上楼格在顺时针 %d 步处" % cw_dist)
	else:
		board_hud.show_toast("🏮 上楼格在逆时针 %d 步处" % ccw_dist)
