class_name AffixData
extends Resource

## Represents a single affix on a dice. Affixes are categorized by when they activate:
## - "roll": triggers during movement dice throwing
## - "embed": triggers when the dice is embedded in equipment
## - "universal": always active while the dice is held (free or embedded)

@export var affix_name: String = ""         # e.g. "锋锐", "灼热", "治愈之光"
@export var affix_type: String = "embed"     # "roll" / "embed" / "universal"
@export var quality_required: String = "white"  # minimum quality to roll this affix
@export var effect_data: Dictionary = {}     # e.g. {"crit_bonus": 5} or {"fire_damage_ratio": 0.5}


func describe() -> String:
	## Returns human-readable description based on effect_data.
	match affix_name:
		"步数修正": return "投掷后点数 ±1（可选）"
		"先手之骰": return "踩战斗格时先手 +1"
		"疾走": return "顺时针移动时额外 +1 步"
		"锋锐": return "嵌入武器时暴击率 +%d%%" % effect_data.get("crit_bonus", 5)
		"坚韧": return "嵌入防具时护甲 +%d" % effect_data.get("armor_bonus", 2)
		"灼热": return "攻击附带骰子面数 ×%.1f 火焰伤害" % effect_data.get("fire_damage_ratio", 0.5)
		"吸血": return "造成伤害的 %d%% 转为 HP" % effect_data.get("lifesteal_percent", 10)
		"治愈之光": return "每层开始恢复 3 HP"
		"虔诚": return "信仰获取 +1"
		"轻负": return "负重上限 +2kg"
	return affix_name


## -- Static factory methods for MVP affix pool --

static func create_step_modifier() -> AffixData:
	var a = AffixData.new()
	a.affix_name = "步数修正"
	a.affix_type = "roll"
	a.quality_required = "white"
	a.effect_data = {"step_modifier": 1}
	return a


static func create_first_strike() -> AffixData:
	var a = AffixData.new()
	a.affix_name = "先手之骰"
	a.affix_type = "roll"
	a.quality_required = "blue"
	a.effect_data = {"initiative_bonus": 1}
	return a


static func create_sprint() -> AffixData:
	var a = AffixData.new()
	a.affix_name = "疾走"
	a.affix_type = "roll"
	a.quality_required = "purple"
	a.effect_data = {"cw_bonus": 1}
	return a


static func create_sharp() -> AffixData:
	var a = AffixData.new()
	a.affix_name = "锋锐"
	a.affix_type = "embed"
	a.quality_required = "white"
	a.effect_data = {"crit_bonus": 5}
	return a


static func create_tough() -> AffixData:
	var a = AffixData.new()
	a.affix_name = "坚韧"
	a.affix_type = "embed"
	a.quality_required = "white"
	a.effect_data = {"armor_bonus": 2}
	return a


static func create_scorching() -> AffixData:
	var a = AffixData.new()
	a.affix_name = "灼热"
	a.affix_type = "embed"
	a.quality_required = "blue"
	a.effect_data = {"fire_damage_ratio": 0.5}
	return a


static func create_lifesteal() -> AffixData:
	var a = AffixData.new()
	a.affix_name = "吸血"
	a.affix_type = "embed"
	a.quality_required = "purple"
	a.effect_data = {"lifesteal_percent": 10}
	return a


static func create_healing_light() -> AffixData:
	var a = AffixData.new()
	a.affix_name = "治愈之光"
	a.affix_type = "universal"
	a.quality_required = "white"
	a.effect_data = {"floor_heal": 3}
	return a


static func create_devout() -> AffixData:
	var a = AffixData.new()
	a.affix_name = "虔诚"
	a.affix_type = "universal"
	a.quality_required = "blue"
	a.effect_data = {"faith_bonus": 1}
	return a


static func create_light_burden() -> AffixData:
	var a = AffixData.new()
	a.affix_name = "轻负"
	a.affix_type = "universal"
	a.quality_required = "blue"
	a.effect_data = {"weight_capacity_bonus": 2}
	return a


## -- Pool of all MVP affixes by quality --

static func get_affix_pool_for_quality(quality: String) -> Array:
	## Returns all possible affixes available at the given quality tier.
	var pool: Array = []
	for a in _all_affixes():
		if _quality_rank(a.quality_required) <= _quality_rank(quality):
			pool.append(a)
	return pool


static func _quality_rank(q: String) -> int:
	match q:
		"white": return 1
		"blue": return 2
		"purple": return 3
		"gold": return 4
	return 1


static func _all_affixes() -> Array[AffixData]:
	return [
		create_step_modifier(), create_first_strike(), create_sprint(),
		create_sharp(), create_tough(), create_scorching(), create_lifesteal(),
		create_healing_light(), create_devout(), create_light_burden(),
	]
