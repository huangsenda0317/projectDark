extends Node
## 单局运行状态（Roguelike Run）。与 DataDB 协作生成楼层与随机。

signal stats_changed
signal board_changed
signal inventory_changed
signal message_requested(text: String)
signal combat_requested(ctx: Dictionary)
signal floor_advanced

const MAX_FLOORS_SLICE: int = 10
const RING_SIZE: int = 30
const BOSS_FLOORS: Array[int] = [4, 7, 10]

var rng: RandomNumberGenerator = RandomNumberGenerator.new()

var floor_num: int = 1
var board_seed: int = 0

var hp: int = 100
var max_hp: int = 100
var mp: int = 40
var max_mp: int = 40
var gold: int = 0
var shards: int = 0
var exp: int = 0
var player_level: int = 1
var exposure: int = 0

## 环上每格：kind=event|stairs|hidden_stairs, event_id, revealed
var cells: Array = []
var player_index: int = 0
var boss_defeated_this_floor: bool = false

var consumables: Dictionary = {}  # id -> count
var equipment: Dictionary = {
	"weapon": "",
	"armor": "",
	"trinket_1": "",
	"trinket_2": "",
}
var spell_cooldowns: Dictionary = {}  # S01 -> turns remaining

var unlocked_spell_ids: Array[String] = ["S01", "S02", "S03"]

var next_roll_steps: int = -1  # C09 / C10
var bonus_ring_steps: int = 0  # S02 等棋盘法术：额外步数
var dice_rerolls_left: int = 0  # C13 掷骰后可重掷次数
var double_dice_next: bool = false  # C08

var next_combat_armor_bonus: int = 0
var bonus_attack_flat: int = 0
var shop_discount: float = 0.0
var time_sand_counter: int = 0

var last_resolved_event_id: String = ""
var secret_stairs_spawned: bool = false  # 整局仅 1 次隐藏楼梯演示

var run_active: bool = false
var victory: bool = false
## 进入战斗场景前写入，战斗结束后由 combat 清空
var combat_context: Dictionary = {}

const META_PATH: String = "user://project_dark_meta.json"


func _ready() -> void:
	pass


func start_new_run(seed_override: int = -1) -> void:
	rng.randomize()
	if seed_override >= 0:
		rng.seed = seed_override
		board_seed = seed_override
	else:
		board_seed = randi()

	floor_num = 1
	hp = 100
	max_hp = 100
	mp = 40
	max_mp = 40
	gold = 0
	shards = 0
	exp = 0
	player_level = 1
	exposure = 0
	player_index = 0
	boss_defeated_this_floor = false
	consumables.clear()
	equipment = {"weapon": "W01", "armor": "A01", "trinket_1": "T01", "trinket_2": ""}
	spell_cooldowns.clear()
	for sid in unlocked_spell_ids:
		spell_cooldowns[sid] = 0
	next_roll_steps = -1
	bonus_ring_steps = 0
	dice_rerolls_left = 0
	double_dice_next = false
	next_combat_armor_bonus = 0
	bonus_attack_flat = 0
	shop_discount = 0.0
	time_sand_counter = 0
	last_resolved_event_id = ""
	secret_stairs_spawned = false
	victory = false
	run_active = true
	add_consumable("C09", 1)
	add_consumable("C13", 2)
	add_consumable("C01", 2)
	_generate_floor()
	stats_changed.emit()
	board_changed.emit()
	inventory_changed.emit()


func write_meta_unlock() -> void:
	var d: Dictionary = {}
	if FileAccess.file_exists(META_PATH):
		var txt: String = FileAccess.get_file_as_string(META_PATH)
		var j: Variant = JSON.parse_string(txt)
		if j is Dictionary:
			d = j
	d["unlock_event_pool_plus"] = true
	d["first_clear_at"] = int(Time.get_unix_time_from_system())
	var f: FileAccess = FileAccess.open(META_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(d, "\t"))
		f.close()


func is_boss_floor() -> bool:
	return floor_num in BOSS_FLOORS


func stairs_accessible() -> bool:
	if is_boss_floor():
		return boss_defeated_this_floor
	return true


func _generate_floor() -> void:
	cells.clear()
	player_index = rng.randi_range(0, RING_SIZE - 1)
	boss_defeated_this_floor = not is_boss_floor()

	var stairs_idx: int = rng.randi_range(0, RING_SIZE - 1)
	var hidden_idx: int = -1
	if (floor_num == 8 or floor_num == 9) and not secret_stairs_spawned and rng.randf() < 0.45:
		hidden_idx = stairs_idx
		while hidden_idx == stairs_idx:
			hidden_idx = rng.randi_range(0, RING_SIZE - 1)
		secret_stairs_spawned = true

	for i in RING_SIZE:
		var cell: Dictionary = {"revealed": false}
		if i == stairs_idx:
			cell["kind"] = "stairs"
			cell["event_id"] = "EV15"
		elif i == hidden_idx:
			cell["kind"] = "hidden_stairs"
			cell["event_id"] = "EV13"
			cell["hidden_locked"] = true
		else:
			cell["kind"] = "event"
			cell["event_id"] = DataDB.pick_weighted_event_for_floor(floor_num, rng)
		cells.append(cell)


func ascend_stairs() -> void:
	if not stairs_accessible():
		return
	if floor_num >= MAX_FLOORS_SLICE:
		victory = true
		run_active = false
		write_meta_unlock()
		board_changed.emit()
		stats_changed.emit()
		return
	floor_num += 1
	player_index = rng.randi_range(0, RING_SIZE - 1)
	boss_defeated_this_floor = not is_boss_floor()
	_generate_floor()
	board_changed.emit()
	stats_changed.emit()


func take_damage(amount: int) -> void:
	hp = maxi(0, hp - amount)
	stats_changed.emit()
	if hp <= 0:
		run_active = false


func heal(amount: int) -> void:
	hp = mini(max_hp, hp + amount)
	stats_changed.emit()


func heal_percent(p: float) -> void:
	heal(int(round(float(max_hp) * p)))


func add_gold(a: int) -> void:
	gold += a
	stats_changed.emit()


func add_shards(a: int) -> void:
	shards += a
	stats_changed.emit()


func add_mp(a: int) -> void:
	mp = mini(max_mp, mp + a)
	stats_changed.emit()


func spend_mp(cost: int) -> bool:
	if mp < cost:
		return false
	mp -= cost
	stats_changed.emit()
	return true


func add_exposure(a: int) -> void:
	exposure = maxi(0, exposure + a)
	stats_changed.emit()


func move_player_on_ring(delta: int) -> void:
	player_index = (player_index + delta) % RING_SIZE
	if player_index < 0:
		player_index += RING_SIZE
	board_changed.emit()


func reveal_cell(idx: int) -> void:
	if idx < 0 or idx >= cells.size():
		return
	cells[idx]["revealed"] = true
	board_changed.emit()


func get_player_attack_power() -> int:
	var base: int = 8 + player_level * 2 + bonus_attack_flat
	var wid: String = equipment.get("weapon", "")
	if wid != "":
		var w: Dictionary = DataDB.get_equipment(wid)
		base += int(w.get("attack_flat", 0))
		base = int(round(float(base) * (1.0 + float(w.get("attack_mult", 0.0)))))
	return base


func get_player_armor() -> int:
	var arm: int = 0
	var aid: String = equipment.get("armor", "")
	if aid != "":
		var a: Dictionary = DataDB.get_equipment(aid)
		arm += int(a.get("armor_flat", 0))
	for tk: String in ["trinket_1", "trinket_2"]:
		var tid2: String = String(equipment.get(tk, ""))
		if tid2 != "":
			var t2: Dictionary = DataDB.get_equipment(tid2)
			arm += int(t2.get("armor_flat", 0))
	return arm


func get_player_holy_resist() -> float:
	var r: float = 0.0
	var aid: String = equipment.get("armor", "")
	if aid != "":
		r += float(DataDB.get_equipment(aid).get("holy_resist", 0.0))
	return r


func add_consumable(cid: String, n: int = 1) -> void:
	var item: Dictionary = DataDB.get_consumable(cid)
	if item.is_empty():
		return
	var max_st: int = int(item.get("max_stack", 5))
	var cur: int = int(consumables.get(cid, 0))
	var add: int = mini(n, maxi(0, max_st - cur))
	if add <= 0:
		add_shards(2)
		return
	consumables[cid] = cur + add
	inventory_changed.emit()


func try_use_consumable_board(cid: String) -> bool:
	if not consumables.get(cid, 0):
		return false
	var item: Dictionary = DataDB.get_consumable(cid)
	var us: String = String(item.get("usable_in", "both"))
	if us == "combat_only":
		return false
	var ref: String = String(item.get("effect_ref", ""))
	if ref == "fixed_steps_3":
		next_roll_steps = 3
	elif ref == "reroll_dice":
		dice_rerolls_left += 1
	elif ref == "heal_hp_25":
		heal_percent(0.25)
	elif ref == "heal_hp_50":
		heal_percent(0.5)
	elif ref == "restore_mp_30":
		add_mp(int(round(float(max_mp) * 0.3)))
	elif ref == "forward_d3":
		move_player_on_ring(rng.randi_range(1, 3))
	elif ref == "forward_4_6":
		move_player_on_ring(rng.randi_range(4, 6))
	elif ref == "back_2_5":
		move_player_on_ring(-rng.randi_range(2, 5))
	elif ref == "fixed_steps_6":
		next_roll_steps = 6
	elif ref == "double_dice_high":
		double_dice_next = true
	elif ref == "reveal_layer_icons":
		for c: Variant in cells:
			if c is Dictionary:
				c["revealed"] = true
		board_changed.emit()
	else:
		message_requested.emit("消耗品效果未实装: " + cid)
		return false
	_decrement_consumable(cid)
	inventory_changed.emit()
	return true


func try_use_consumable_combat(cid: String) -> bool:
	if not consumables.get(cid, 0):
		return false
	var item: Dictionary = DataDB.get_consumable(cid)
	var us: String = String(item.get("usable_in", "both"))
	if us == "board_only":
		return false
	var ref: String = String(item.get("effect_ref", ""))
	if ref == "heal_hp_25":
		heal_percent(0.25)
	elif ref == "heal_hp_50":
		heal_percent(0.5)
	elif ref == "restore_mp_30":
		add_mp(int(round(float(max_mp) * 0.3)))
	elif ref == "restore_full_mp":
		mp = max_mp
		stats_changed.emit()
	else:
		message_requested.emit("战斗中不可用: " + cid)
		return false
	_decrement_consumable(cid)
	inventory_changed.emit()
	return true


func _decrement_consumable(cid: String) -> void:
	var n: int = int(consumables.get(cid, 0)) - 1
	if n <= 0:
		consumables.erase(cid)
	else:
		consumables[cid] = n


func roll_d6() -> int:
	if next_roll_steps >= 0:
		var v: int = next_roll_steps
		next_roll_steps = -1
		return v
	if double_dice_next:
		double_dice_next = false
		return maxi(rng.randi_range(1, 6), rng.randi_range(1, 6))
	var r: int = rng.randi_range(1, 6)
	return r
