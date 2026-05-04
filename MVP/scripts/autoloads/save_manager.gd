extends Node

## Save/Load manager using FileAccess + JSON serialization.
## Auto-saves after every tile trigger. Single save slot.

const SAVE_PATH := "user://mvp_save.json"

## Resource-path lookup tables for deserialization.
const EQUIPMENT_PATH_MAP := {
	"starter_dagger": "res://resources/equipment/starter_dagger.tres",
	"knight_hammer": "res://resources/equipment/knight_set/knight_hammer.tres",
	"knight_shield": "res://resources/equipment/knight_set/knight_shield.tres",
	"knight_helmet": "res://resources/equipment/knight_set/knight_helmet.tres",
	"knight_chestplate": "res://resources/equipment/knight_set/knight_chestplate.tres",
	"knight_gauntlets": "res://resources/equipment/knight_set/knight_gauntlets.tres",
	"knight_leggings": "res://resources/equipment/knight_set/knight_leggings.tres",
}

const ITEM_PATH_MAP := {
	"healing_potion": "res://resources/items/healing_potion.tres",
	"d4_white_dice": "res://resources/items/d4_white_dice.tres",
	"destiny_dice": "res://resources/items/destiny_dice.tres",
	"reveal_crystal": "res://resources/items/reveal_crystal.tres",
	"repair_paste": "res://resources/items/repair_paste.tres",
	"guide_lantern": "res://resources/items/guide_lantern.tres",
}

var save_data: Dictionary = {}


func _load_equipment_by_id(item_id: String) -> EquipmentData:
	var path = EQUIPMENT_PATH_MAP.get(item_id, "")
	if path.is_empty():
		push_error("SaveManager: Unknown equipment item_id '%s'" % item_id)
		return null
	var res = load(path)
	if res and res is EquipmentData:
		return res
	push_error("SaveManager: Failed to load equipment from '%s'" % path)
	return null


func _load_item_by_id(item_id: String) -> ConsumableData:
	var path = ITEM_PATH_MAP.get(item_id, "")
	if path.is_empty():
		push_error("SaveManager: Unknown item item_id '%s'" % item_id)
		return null
	var res = load(path)
	if res and res is ConsumableData:
		return res
	push_error("SaveManager: Failed to load item from '%s'" % path)
	return null


func _deserialize_one_dice(dd: Dictionary) -> DiceData:
	var d = DiceData.new()
	d.dice_id = dd.get("dice_id", "")
	d.face_count = dd.get("face_count", 6)
	d.quality = dd.get("quality", "white")
	d.wear = dd.get("wear", 0)
	d.max_wear = dd.get("max_wear", 6)
	d.is_shattered = dd.get("is_shattered", false)
	for ad in dd.get("affixes", []):
		var a = AffixData.new()
		a.affix_name = ad.get("name", "")
		a.affix_type = ad.get("type", "")
		a.effect_data = ad.get("effect", {})
		d.affixes.append(a)
	return d


func auto_save() -> void:
	save_data = serialize_state()
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(save_data, "\t"))
		file.close()
		EventBus.game_saved.emit()


func load_game() -> bool:
	if not FileAccess.file_exists(SAVE_PATH):
		return false
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if not file:
		return false
	var text = file.get_as_text()
	file.close()
	var json = JSON.new()
	var err = json.parse(text)
	if err != OK:
		push_error("Save file parse error: ", json.get_error_message())
		return false
	save_data = json.data
	deserialize_state(save_data)
	EventBus.game_loaded.emit()
	return true


func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


func delete_save() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(SAVE_PATH)


## -- Serialization --

func serialize_state() -> Dictionary:
	return {
		"version": 1,
		"player": {
			"hp": GameState.player_hp,
			"max_hp": GameState.player_max_hp,
			"level": GameState.player_level,
			"exp": GameState.player_exp,
			"exp_to_next": GameState.exp_to_next,
			"base_strength": GameState.base_strength,
			"base_agility": GameState.base_agility,
			"base_intelligence": GameState.base_intelligence,
			"base_constitution": GameState.base_constitution,
			"base_faith_attr": GameState.base_faith_attr,
			"strength": GameState.strength,
			"agility": GameState.agility,
			"intelligence": GameState.intelligence,
			"constitution": GameState.constitution,
			"faith_attr": GameState.faith_attr,
			"attribute_points": GameState.attribute_points,
		},
		"currencies": {
			"gold": GameState.gold,
			"faith": GameState.faith,
		},
		"dice": _serialize_dice(),
		"equipment": _serialize_equipment(),
		"inventory": _serialize_inventory(),
		"relics": _serialize_relics(),
		"run": {
			"tower_id": GameState.current_tower_id,
			"floor": GameState.current_floor,
			"tile_index": GameState.current_tile_index,
			"total_floors": GameState.total_floors_in_tower,
			"curse_level": GameState.curse_level,
			"seed": GameState.run_seed,
			"dice_box_capacity": GameState.dice_box_capacity,
			"destiny_value": GameState.destiny_value,
		},
		"death": {
			"is_dead": GameState.is_dead,
			"consecutive_deaths": GameState.consecutive_deaths,
			"location": GameState.death_location,
			"gold_dropped": GameState.death_gold_dropped,
			"equipment_dropped": _serialize_death_equipment(),
		},
		"village": {
			"level": GameState.village_level,
			"resources": GameState.village_resources,
			"faith": GameState.village_faith,
			"villagers": GameState.recruited_villagers,
		},
	}


func deserialize_state(data: Dictionary) -> void:
	var p = data.get("player", {})
	GameState.player_hp = p.get("hp", 45)
	GameState.player_max_hp = p.get("max_hp", 45)
	GameState.player_level = p.get("level", 1)
	GameState.player_exp = p.get("exp", 0)
	GameState.exp_to_next = p.get("exp_to_next", 20)
	GameState.base_strength = p.get("base_strength", 3)
	GameState.base_agility = p.get("base_agility", 3)
	GameState.base_intelligence = p.get("base_intelligence", 3)
	GameState.base_constitution = p.get("base_constitution", 3)
	GameState.base_faith_attr = p.get("base_faith_attr", 3)
	GameState.strength = p.get("strength", 3)
	GameState.agility = p.get("agility", 3)
	GameState.intelligence = p.get("intelligence", 3)
	GameState.constitution = p.get("constitution", 3)
	GameState.faith_attr = p.get("faith_attr", 3)
	GameState.attribute_points = p.get("attribute_points", 0)

	var c = data.get("currencies", {})
	GameState.gold = c.get("gold", 0)
	GameState.faith = c.get("faith", 10)

	_deserialize_dice(data.get("dice", []))
	_deserialize_equipment(data.get("equipment", {}))
	_deserialize_inventory(data.get("inventory", []))
	_deserialize_relics(data.get("relics", []))

	var r = data.get("run", {})
	GameState.current_tower_id = r.get("tower_id", "")
	GameState.current_tower = GameState._load_tower_data(GameState.current_tower_id)
	GameState.current_floor = r.get("floor", 0)
	GameState.current_tile_index = r.get("tile_index", 0)
	GameState.total_floors_in_tower = r.get("total_floors", 3)
	GameState.curse_level = r.get("curse_level", 0)
	GameState.run_seed = r.get("seed", 0)
	GameState.dice_box_capacity = r.get("dice_box_capacity", 2)
	GameState.destiny_value = r.get("destiny_value", -1)
	RNG.init_seed(GameState.run_seed)

	var d = data.get("death", {})
	GameState.is_dead = d.get("is_dead", false)
	GameState.consecutive_deaths = d.get("consecutive_deaths", 0)
	GameState.death_location = d.get("location", {})
	GameState.death_gold_dropped = d.get("gold_dropped", 0)
	# Restore dropped equipment
	var dropped_eq = d.get("equipment_dropped", {})
	if not dropped_eq.is_empty():
		var deq_id = dropped_eq.get("item_id", "")
		var deq_path = dropped_eq.get("resource_path", "")
		var eq: EquipmentData = null
		if not deq_path.is_empty() and ResourceLoader.exists(deq_path):
			var template = load(deq_path)
			if template:
				eq = template.duplicate() if template is Resource else null
		else:
			eq = _load_equipment_by_id(deq_id)
		if eq:
			var emb_data = dropped_eq.get("embedded_dice", {})
			if not emb_data.is_empty() and emb_data.get("dice_id", "") != "":
				eq.embedded_dice = _deserialize_one_dice(emb_data)
			GameState.death_equipment_dropped = eq

	var v = data.get("village", {})
	GameState.village_level = v.get("level", 1)
	GameState.village_resources = v.get("resources", 0)
	GameState.village_faith = v.get("faith", 0)
	GameState.recruited_villagers = v.get("villagers", [])

	GameState.update_weight()


func _serialize_dice() -> Array:
	var arr: Array = []
	for d in GameState.dice_box:
		arr.append(_dice_to_dict(d))
	# Also serialize embedded dice
	for slot in GameState.equipment_slots:
		var eq = GameState.equipment_slots[slot]
		if eq and eq is EquipmentData and eq.embedded_dice:
			arr.append(_dice_to_dict(eq.embedded_dice))
	return arr


func _dice_to_dict(d: Resource) -> Dictionary:
	if d == null: return {}
	var affixes: Array = []
	var affix_list = d.affixes
	if affix_list != null:
		for a in affix_list:
			affixes.append({"name": a.affix_name, "type": a.affix_type, "effect": a.effect_data})
	return {
		"dice_id": d.dice_id if d.dice_id else "",
		"face_count": d.face_count if d.face_count else 6,
		"quality": d.quality if d.quality else "white",
		"wear": d.wear if d.wear else 0,
		"max_wear": d.max_wear if d.max_wear else 6,
		"is_shattered": d.is_shattered if d.is_shattered else false,
		"affixes": affixes,
	}


func _serialize_death_equipment() -> Dictionary:
	var eq = GameState.death_equipment_dropped
	if eq == null or not eq is EquipmentData:
		return {}
	return {
		"item_id": eq.item_id,
		"resource_path": EQUIPMENT_PATH_MAP.get(eq.item_id, ""),
		"embedded_dice": _dice_to_dict(eq.embedded_dice),
	}


func _deserialize_dice(arr: Array) -> void:
	GameState.dice_box.clear()
	for dd in arr:
		var d = _deserialize_one_dice(dd)
		GameState.dice_box.append(d)


func _serialize_equipment() -> Dictionary:
	var eq_dict := {}
	for slot in GameState.equipment_slots:
		var eq = GameState.equipment_slots[slot]
		if eq:
			eq_dict[slot] = {
				"item_id": eq.item_id,
				"resource_path": EQUIPMENT_PATH_MAP.get(eq.item_id, ""),
				"embedded_dice": _dice_to_dict(eq.embedded_dice),
			}
		else:
			eq_dict[slot] = null
	return eq_dict


func _deserialize_equipment(data: Dictionary) -> void:
	GameState._unequip_all()
	for slot in GameState.equipment_slots:
		if data.has(slot) and data[slot] != null:
			var ed = data[slot]
			var resource_path = ed.get("resource_path", "")
			var item_id = ed.get("item_id", "")

			var eq: EquipmentData = null
			if not resource_path.is_empty() and ResourceLoader.exists(resource_path):
				var template = load(resource_path)
				if template:
					eq = template.duplicate() if template is Resource else null
			else:
				eq = _load_equipment_by_id(item_id)

			if eq == null:
				push_error("SaveManager: Cannot restore equipment '%s' for slot '%s'" % [item_id, slot])
				continue

			var emb_data = ed.get("embedded_dice", {})
			if not emb_data.is_empty() and emb_data.get("dice_id", "") != "":
				eq.embedded_dice = _deserialize_one_dice(emb_data)
			else:
				eq.embedded_dice = null

			GameState.equipment_slots[slot] = eq
			EventBus.equipment_equipped.emit(eq.item_id, slot)

	GameState.apply_equipment_stats()
	GameState.update_weight()


func _serialize_inventory() -> Array:
	var arr: Array = []
	for item in GameState.backpack:
		var item_id = item.get("item_id") if item.get("item_id") else ""
		var item_type = item.get("item_type") if item.get("item_type") else ""
		arr.append({
			"item_id": item_id,
			"type": item_type,
			"resource_path": ITEM_PATH_MAP.get(item_id, ""),
		})
	return arr


func _deserialize_inventory(arr: Array) -> void:
	GameState.backpack.clear()
	for idict in arr:
		var item_id = idict.get("item_id", "")
		var resource_path = idict.get("resource_path", "")
		var item: Resource = null
		if not resource_path.is_empty() and ResourceLoader.exists(resource_path):
			var template = load(resource_path)
			if template:
				item = template.duplicate() if template is Resource else null
		else:
			item = _load_item_by_id(item_id)
		if item:
			GameState.backpack.append(item)
		else:
			push_error("SaveManager: Cannot restore inventory item '%s'" % item_id)


func _serialize_relics() -> Array:
	var arr: Array = []
	for r in GameState.relics:
		var relic_id = r.get("relic_id") if r.get("relic_id") else ""
		var relic_name = r.get("relic_name") if r.get("relic_name") else ""
		arr.append({"relic_id": relic_id, "relic_name": relic_name})
	return arr


func _deserialize_relics(arr: Array) -> void:
	GameState.relics.clear()
	for rd in arr:
		GameState.relics.append(rd)
