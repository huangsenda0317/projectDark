class_name SetBonusManager
extends RefCounted

## Detects equipped set pieces and returns active bonus tiers.
## Used by CombatEngine and PlayerEntity to apply set effects.

const SET_DEFS: Dictionary = {
	"knight": {
		"name": "骑士套装",
		"bonuses": {
			2: {"auto_armor_per_turn": 4},
			4: {"unlock_skill": "holy_charge"},
			6: {"death_save": true},
		},
	},
}


static func count_set_pieces(set_name: String) -> int:
	var count := 0
	for slot in GameState.equipment_slots:
		var eq = GameState.equipment_slots[slot]
		if eq and eq is EquipmentData and eq.set_name == set_name:
			count += 1
	return count


static func get_active_bonuses(set_name: String) -> Dictionary:
	var count = count_set_pieces(set_name)
	var defs = SET_DEFS.get(set_name, {})
	var bonuses: Dictionary = {}
	var tier_defs: Dictionary = defs.get("bonuses", {})
	for tier in tier_defs:
		if count >= int(tier):
			bonuses.merge(tier_defs[tier], true)
	return bonuses


static func has_set_bonus(set_name: String, bonus_key: String) -> bool:
	var bonuses = get_active_bonuses(set_name)
	return bonuses.has(bonus_key)


static func get_auto_armor(set_name: String = "knight") -> int:
	var bonuses = get_active_bonuses(set_name)
	return bonuses.get("auto_armor_per_turn", 0)
