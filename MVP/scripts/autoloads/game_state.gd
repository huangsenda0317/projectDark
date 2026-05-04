extends Node

## Central game state — the authoritative source of truth for the current run.
## This holds player data, current floor/tile, and all intermediate state.
## Village progress is tracked separately (village_state).

# -- Player core --
var player_hp: int = 45
var player_max_hp: int = 45
var player_level: int = 1
var player_exp: int = 0
var exp_to_next: int = 20

# -- Base attributes (from level-up investment, without equipment bonuses) --
var base_strength: int = 3
var base_agility: int = 3
var base_intelligence: int = 3
var base_constitution: int = 3
var base_faith_attr: int = 3

# -- Effective attributes (base + equipment bonuses) --
var strength: int = 3      # STR
var agility: int = 3       # AGI
var intelligence: int = 3  # INT
var constitution: int = 3  # CON
var faith_attr: int = 3    # FAI
var attribute_points: int = 0

# -- Currencies --
var gold: int = 0
var faith: int = 10

# -- Weight --
var current_weight: float = 0.0
var max_weight: float = 16.0  # 10 + STR * 2

# -- Dice --
var dice_box: Array = []          # Array of DiceData
var dice_box_capacity: int = 2
const MAX_DICE_BOX_CAPACITY: int = 4

# -- Allocation lock --
var allocation_locked: bool = false  # true during combat

# -- Equipment (11 slots, stored as EquipmentData or null) --
var equipment_slots: Dictionary = {
	"weapon": null, "offhand": null,
	"helmet": null, "chestplate": null, "gauntlets": null, "leggings": null,
	"boots": null, "cloak": null, "belt": null,
	"ring_1": null, "ring_2": null, "necklace": null,
}

# -- Inventory --
var backpack: Array = []           # Array of items
var backpack_capacity: int = 6

# -- Relics --
var relics: Array = []
var relic_capacity: int = 6

# -- Run progress --
var current_tower: TowerData = null
var current_tower_id: String = ""
var current_floor: int = 0
var current_tile_index: int = 0
var total_floors_in_tower: int = 3
var curse_level: int = 0
var run_seed: int = 0
var destiny_value: int = -1  # -1 = disabled, 1-6 = fixed next roll value

# -- Death state --
var death_location: Dictionary = {}   # {tower_id, floor, tile_index}
var death_gold_dropped: int = 0
var death_equipment_dropped = null
var consecutive_deaths: int = 0
var is_dead: bool = false

# -- Village progress (persisted across runs) --
var village_level: int = 1            # 1=村落, 2=村庄
var village_resources: int = 0
var village_faith: int = 0
var recruited_villagers: Array = []


## -- Initialization --

func new_run(tower_id: String, seed_val: int = -1) -> void:
	reset_player_state()
	current_tower_id = tower_id
	current_tower = _load_tower_data(tower_id)
	current_floor = 1
	total_floors_in_tower = _roll_total_floors()
	consecutive_deaths = 0
	is_dead = false
	death_location.clear()
	death_gold_dropped = 0
	death_equipment_dropped = null
	destiny_value = -1

	if seed_val == -1:
		run_seed = randi()
	else:
		run_seed = seed_val
	RNG.init_seed(run_seed)

	gold = 0
	faith = 10
	# Grant starter dice
	dice_box.clear()
	dice_box.append(_create_starter_dice("d4", "white"))
	dice_box.append(_create_starter_dice("d6", "white"))
	dice_box_capacity = 2

	# Grant starter equipment
	var dagger = load("res://resources/equipment/starter_dagger.tres")
	if dagger:
		equipment_slots["weapon"] = dagger
	apply_equipment_stats()
	update_weight()

	EventBus.game_started.emit()
	EventBus.run_started.emit()


func _load_tower_data(tower_id: String) -> TowerData:
	var path = "res://resources/towers/%s.tres" % tower_id
	if ResourceLoader.exists(path):
		return load(path)
	push_error("TowerData not found: %s" % path)
	return null


func _roll_total_floors() -> int:
	if current_tower:
		return RNG.randi_range(current_tower.min_floors, current_tower.max_floors)
	return RNG.randi_range(3, 6)


func reset_player_state() -> void:
	player_hp = 30 + constitution * 5
	player_max_hp = player_hp
	player_level = 1
	player_exp = 0
	exp_to_next = 20
	base_strength = 3
	base_agility = 3
	base_intelligence = 3
	base_constitution = 3
	base_faith_attr = 3
	strength = 3
	agility = 3
	intelligence = 3
	constitution = 3
	faith_attr = 3
	attribute_points = 0
	gold = 0
	faith = 10
	backpack.clear()
	relics.clear()
	_unequip_all()
	update_weight()


func revive_in_village() -> void:
	is_dead = false
	player_hp = ceili(player_max_hp * 0.5)
	faith = maxi(5, faith)
	# All embedded dice shatter
	for slot in equipment_slots:
		var eq = equipment_slots[slot]
		if eq and eq.embedded_dice:
			var emb = eq.embedded_dice
			emb.is_shattered = true
			emb.wear = emb.max_wear
			EventBus.dice_shattered.emit(emb.dice_id)

	_unequip_all()
	consecutive_deaths += 1
	EventBus.player_revived.emit("village")


## -- Attribute helpers --

func get_max_hp() -> int:
	return 30 + constitution * 5 + (player_level - 1) * 5 + maxi(0, player_level - 3) * 3


func get_ap_per_turn() -> int:
	return 3 + agility / 5


func get_weight_max() -> float:
	var base := 10.0 + strength * 2.0
	for dice in get_all_dice():
		for affix in dice.get_affixes_by_type("universal"):
			if affix.affix_name == "轻负":
				base += affix.effect_data.get("weight_capacity_bonus", 2)
	return base


func get_weight_status() -> String:
	var ratio = current_weight / maxi(max_weight, 1.0)
	if ratio <= 0.5: return "light"
	if ratio <= 0.8: return "normal"
	if ratio <= 1.0: return "heavy"
	return "overloaded"


func apply_weight_effects() -> Dictionary:
	var status = get_weight_status()
	match status:
		"light":   return {"dodge_bonus": 10, "dice_bonus": 1}
		"normal":  return {}
		"heavy":   return {"initiative_penalty": -20}
		"overloaded": return {"fatigue_damage": 2, "damage_penalty": -0.30}
	return {}


func update_weight() -> void:
	var w: float = 0.0
	for slot in equipment_slots:
		var eq = equipment_slots[slot]
		if eq and eq is EquipmentData:
			w += eq.weight
	for item in backpack:
		if item is Resource:
			var item_w = item.get("weight")
			if item_w != null:
				w += item_w
	current_weight = w
	max_weight = get_weight_max()
	EventBus.weight_changed.emit(current_weight, max_weight, get_weight_status())


## -- Dice management --

func add_dice(dice: Resource) -> bool:
	if dice_box.size() < dice_box_capacity:
		dice_box.append(dice)
		return true
	return false


func expand_dice_box() -> bool:
	if dice_box_capacity < MAX_DICE_BOX_CAPACITY:
		dice_box_capacity += 1
		return true
	return false


func lock_allocation() -> void:
	allocation_locked = true


func unlock_allocation() -> void:
	allocation_locked = false


func remove_dice(dice_id: String) -> bool:
	for i in dice_box.size():
		if dice_box[i].dice_id == dice_id:
			dice_box.remove_at(i)
			return true
	return false


func get_all_dice() -> Array:
	## Returns all dice (free + embedded) for move-roll selection.
	var all: Array = []
	all.append_array(dice_box)
	for slot in equipment_slots:
		var eq = equipment_slots[slot]
		if eq and eq.embedded_dice:
			all.append(eq.embedded_dice)
	return all


func has_usable_dice() -> bool:
	return get_all_dice().size() > 0


## -- Equipment helpers --

func equip_item(item: Resource, slot: String) -> bool:
	if not slot in equipment_slots:
		return false
	if equipment_slots[slot] != null:
		_unequip_slot(slot)
	equipment_slots[slot] = item
	apply_equipment_stats()
	update_weight()
	EventBus.equipment_equipped.emit(item.item_id, slot)
	return true


func unequip_slot(slot: String) -> void:
	_unequip_slot(slot)
	apply_equipment_stats()
	update_weight()


func _unequip_slot(slot: String) -> void:
	if equipment_slots[slot] != null:
		var item = equipment_slots[slot]
		equipment_slots[slot] = null
		EventBus.equipment_unequipped.emit(item.item_id, slot)


func _unequip_all() -> void:
	for slot in equipment_slots:
		_unequip_slot(slot)


func apply_equipment_stats() -> void:
	# Recalculate stat bonuses from equipment.
	# Called after any equipment change.
	# Weapons do NOT provide attribute bonuses (per GDD v0.4).
	var bonus_str = 0; var bonus_agi = 0; var bonus_int = 0
	var bonus_con = 0; var bonus_fai = 0

	for slot in equipment_slots:
		var eq = equipment_slots[slot]
		if eq and eq is EquipmentData:
			if eq.slot_type == "weapon":
				continue  # weapons give no attribute bonuses
			bonus_str += eq.bonus_str if eq.get("bonus_str") else 0
			bonus_agi += eq.bonus_agi if eq.get("bonus_agi") else 0
			bonus_int += eq.bonus_int if eq.get("bonus_int") else 0
			bonus_con += eq.bonus_con if eq.get("bonus_con") else 0
			bonus_fai += eq.bonus_fai if eq.get("bonus_fai") else 0

	strength = base_strength + bonus_str
	agility = base_agility + bonus_agi
	intelligence = base_intelligence + bonus_int
	constitution = base_constitution + bonus_con
	faith_attr = base_faith_attr + bonus_fai
	player_max_hp = get_max_hp()
	if player_hp > player_max_hp:
		player_hp = player_max_hp


## -- Leveling --

func gain_exp(amount: int) -> void:
	player_exp += amount
	EventBus.experience_gained.emit(amount, player_exp, exp_to_next)
	while player_exp >= exp_to_next:
		level_up_player()


func level_up_player() -> void:
	player_exp -= exp_to_next
	player_level += 1
	attribute_points += 2
	exp_to_next = _exp_for_level(player_level + 1)
	player_max_hp = get_max_hp()
	player_hp = player_max_hp  # full heal on level up
	EventBus.level_up.emit(player_level)


func _exp_for_level(lvl: int) -> int:
	# Exponential curve: 20, 50, 100, 180, 300, 500...
	if lvl <= 2: return 20
	if lvl <= 3: return 50
	if lvl <= 4: return 100
	if lvl <= 5: return 180
	return 180 + (lvl - 5) * 120


## -- Curse --

func add_curse(amount: int = 1) -> void:
	curse_level += amount


## -- Setters with signal emission --

func set_gold(value: int) -> void:
	var delta = value - gold
	gold = value
	EventBus.gold_changed.emit(gold, delta)


func increment_base_attr(attr_key: String) -> void:
	if attribute_points <= 0:
		return
	match attr_key:
		"strength": base_strength += 1
		"agility": base_agility += 1
		"intelligence": base_intelligence += 1
		"constitution": base_constitution += 1
		"faith_attr": base_faith_attr += 1
		_: return
	attribute_points -= 1
	apply_equipment_stats()
	EventBus.attribute_changed.emit(attr_key, get(attr_key))


func add_gold(amount: int) -> void:
	set_gold(gold + amount)


func set_faith(value: int) -> void:
	var delta = value - faith
	faith = value
	EventBus.faith_changed.emit(faith, delta)


func add_faith(amount: int) -> void:
	if amount > 0:
		for dice in get_all_dice():
			for affix in dice.get_affixes_by_type("universal"):
				if affix.affix_name == "虔诚":
					amount += affix.effect_data.get("faith_bonus", 1)
	set_faith(faith + amount)


func take_damage(amount: int) -> void:
	var actual = maxi(0, amount)
	player_hp = maxi(0, player_hp - actual)
	EventBus.player_damaged.emit(actual, player_hp)
	if player_hp <= 0:
		handle_death()


func heal(amount: int) -> void:
	var actual = mini(amount, player_max_hp - player_hp)
	player_hp += actual
	EventBus.player_healed.emit(actual, player_hp)


func handle_death() -> void:
	is_dead = true
	death_location = {"tower_id": current_tower_id, "floor": current_floor, "tile_index": current_tile_index}
	death_gold_dropped = ceili(gold * 0.30)
	gold -= death_gold_dropped

	if consecutive_deaths < 2 and equipment_slots.values().any(func(e): return e != null):
		if randf() < 0.15:
			for slot in equipment_slots:
				if equipment_slots[slot] != null:
					death_equipment_dropped = equipment_slots[slot]
					equipment_slots[slot] = null
					break

	set_faith(ceili(faith * 0.70))
	EventBus.player_died.emit()


## -- Internal helpers --

func _create_starter_dice(face: String, quality: String) -> Resource:
	var d = DiceData.new()
	d.dice_id = "%s_%s_starter_%d" % [face, quality, randi()]
	d.face_count = 4 if face == "d4" else 6
	d.quality = quality
	d.wear = 0
	d.max_wear = d.face_count
	d.is_shattered = false
	return d
