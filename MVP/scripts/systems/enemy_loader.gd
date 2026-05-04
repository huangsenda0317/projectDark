class_name EnemyLoader
extends Node

## Loads enemy definitions from enemies.json and creates EnemyData resources.
## Provides floor-level enemy selection logic.

var _defs: Array = []
var _normal_pool: Array = []
var _boss_def: Dictionary = {}


func _ready() -> void:
	var file = FileAccess.open("res://assets/data/enemies.json", FileAccess.READ)
	if file == null:
		push_error("EnemyLoader: Failed to open enemies.json")
		return
	var text = file.get_as_text()
	file.close()
	var data = JSON.parse_string(text)
	if data == null:
		push_error("EnemyLoader: Failed to parse enemies.json")
		return

	var enemies: Array = data.get("enemies", [])
	for def in enemies:
		_defs.append(def)
		if def.get("is_boss", false):
			_boss_def = def
		else:
			_normal_pool.append(def)


func get_enemy_for_floor(floor: int, is_last_floor: bool) -> EnemyData:
	if is_last_floor or (floor >= 4 and RNG.randf() < 0.25):
		return _create_enemy_data(_boss_def)

	var def: Dictionary
	if _normal_pool.is_empty():
		def = _boss_def
	else:
		def = _normal_pool[RNG.randi_range(0, _normal_pool.size() - 1)]

	return _create_enemy_data(def)


func _create_enemy_data(def: Dictionary) -> EnemyData:
	var data = EnemyData.new()
	data.enemy_id = def.get("enemy_id", "")
	data.enemy_name = def.get("enemy_name", "???")
	data.is_boss = def.get("is_boss", false)
	data.max_hp = def.get("max_hp", 30)
	data.armor = def.get("armor", 0)
	data.attack_damage_min = def.get("attack_damage_min", 4)
	data.attack_damage_max = def.get("attack_damage_max", 8)
	data.crit_chance = def.get("crit_chance", 5.0)
	data.speed = def.get("speed", 5)

	var iw: Dictionary = def.get("intent_weights", {})
	data.intent_weights = {
		"attack": iw.get("attack", 50),
		"defend": iw.get("defend", 25),
		"heavy_attack": iw.get("heavy_attack", 25),
	}

	data.exp_reward = def.get("exp_reward", 5)
	data.gold_min = def.get("gold_min", 3)
	data.gold_max = def.get("gold_max", 10)
	data.dice_drop_chance = def.get("dice_drop_chance", 0.10)

	var phases: Array = def.get("boss_phases", [])
	for p in phases:
		var pd = BossPhaseData.new()
		pd.phase_name = p.get("phase_name", "Phase")
		pd.hp_threshold = p.get("hp_threshold", 0.5)
		var piw: Dictionary = p.get("intent_weights", {})
		pd.intent_weights = {
			"attack": piw.get("attack", 40),
			"defend": piw.get("defend", 25),
			"heavy_attack": piw.get("heavy_attack", 35),
		}
		pd.bonus_armor = p.get("bonus_armor", 2)
		pd.special_effect = p.get("special_effect", "")
		pd.special_value = p.get("special_value", 1)
		data.boss_phases.append(pd)

	return data
