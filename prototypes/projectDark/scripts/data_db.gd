extends Node
## 加载 data/*.json，供棋盘、战斗、事件解释器查询。

var events: Array = []
var events_by_id: Dictionary = {}
var consumables: Array = []
var consumables_by_id: Dictionary = {}
var equipment: Array = []
var equipment_by_id: Dictionary = {}
var spells: Array = []
var spells_by_id: Dictionary = {}
var bosses: Array = []
var bosses_by_id: Dictionary = {}
var enemies: Array = []
var enemies_by_id: Dictionary = {}

var load_errors: PackedStringArray = []
var _meta_unlock_plus: bool = false


func _ready() -> void:
	refresh_meta_unlock()
	_reload_all()


func refresh_meta_unlock() -> void:
	_meta_unlock_plus = false
	var p: String = "user://project_dark_meta.json"
	if not FileAccess.file_exists(p):
		return
	var j: Variant = JSON.parse_string(FileAccess.get_file_as_string(p))
	if j is Dictionary and bool(j.get("unlock_event_pool_plus", false)):
		_meta_unlock_plus = true


func _reload_all() -> void:
	load_errors.clear()
	events.clear()
	events_by_id.clear()
	consumables.clear()
	consumables_by_id.clear()
	equipment.clear()
	equipment_by_id.clear()
	spells.clear()
	spells_by_id.clear()
	bosses.clear()
	bosses_by_id.clear()
	enemies.clear()
	enemies_by_id.clear()

	_load_array("res://data/events.json", "events", events, events_by_id, "event_id")
	_load_array("res://data/consumables.json", "consumables", consumables, consumables_by_id, "id")
	_load_array("res://data/equipment.json", "equipment", equipment, equipment_by_id, "id")
	_load_array("res://data/spells.json", "spells", spells, spells_by_id, "id")
	_load_array("res://data/bosses.json", "bosses", bosses, bosses_by_id, "id")
	_load_array("res://data/enemies.json", "enemies", enemies, enemies_by_id, "id")

	if load_errors.size() > 0:
		push_warning("DataDB: %d load issues — check JSON paths" % load_errors.size())


func _load_array(path: String, key: String, out_arr: Array, out_map: Dictionary, id_field: String) -> void:
	if not FileAccess.file_exists(path):
		load_errors.append("missing: %s" % path)
		return
	var f: String = FileAccess.get_file_as_string(path)
	var data: Variant = JSON.parse_string(f)
	if data == null:
		load_errors.append("json parse: %s" % path)
		return
	if typeof(data) != TYPE_DICTIONARY:
		load_errors.append("root not dict: %s" % path)
		return
	var arr: Variant = data.get(key, [])
	if typeof(arr) != TYPE_ARRAY:
		load_errors.append("no %s array: %s" % [key, path])
		return
	for item: Variant in arr:
		if typeof(item) != TYPE_DICTIONARY:
			continue
		var d: Dictionary = item
		var eid: String = String(d.get(id_field, ""))
		if eid.is_empty():
			load_errors.append("empty id in %s" % path)
			continue
		out_arr.append(d)
		out_map[eid] = d


func get_event(event_id: String) -> Dictionary:
	return events_by_id.get(event_id, {})


func get_consumable(cid: String) -> Dictionary:
	return consumables_by_id.get(cid, {})


func get_equipment(eid: String) -> Dictionary:
	return equipment_by_id.get(eid, {})


func get_spell(sid: String) -> Dictionary:
	return spells_by_id.get(sid, {})


func get_boss(bid: String) -> Dictionary:
	return bosses_by_id.get(bid, {})


func get_enemy(eid: String) -> Dictionary:
	return enemies_by_id.get(eid, {})


func pick_weighted_event_for_floor(floor_num: int, rng: RandomNumberGenerator) -> String:
	var weights: Array[float] = []
	var ids: PackedStringArray = []
	var act_key: String = "weight_act1"
	for ev: Dictionary in events:
		var eid: String = String(ev.get("event_id", ""))
		if eid.is_empty() or ev.get("pool", true) == false:
			continue
		if ev.get("requires_meta", false) == true and not _meta_unlock_plus:
			continue
		var mn: int = int(ev.get("min_floor", 1))
		var mx: int = int(ev.get("max_floor", 99))
		if floor_num < mn or floor_num > mx:
			continue
		if eid == "EV15":
			continue
		var w: float = float(ev.get(act_key, 1))
		if w <= 0:
			continue
		weights.append(w)
		ids.append(eid)
	if ids.is_empty():
		return "EV01"
	var total: float = 0.0
	for w in weights:
		total += w
	var r: float = rng.randf() * total
	var acc: float = 0.0
	for i in ids.size():
		acc += weights[i]
		if r <= acc:
			return ids[i]
	return ids[ids.size() - 1]
