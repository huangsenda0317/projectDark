class_name EquipmentData
extends Resource

## Represents a single piece of equipment — armor, weapon, accessory.
## Each equipment has base stats and a dice socket for embedding.

@export var item_id: String = ""
@export var item_name: String = ""
@export var slot_type: String = ""       # weapon/offhand/helmet/chestplate/gauntlets/leggings/boots/cloak/belt/ring/necklace
@export var quality: String = "white"
@export var weight: float = 1.0          # kg

# -- Base stats (weapons do NOT provide attribute bonuses per GDD v0.4) --
@export var bonus_str: int = 0
@export var bonus_agi: int = 0
@export var bonus_int: int = 0
@export var bonus_con: int = 0
@export var bonus_fai: int = 0

# -- Weapon-specific base stats --
@export var base_damage_min: int = 1
@export var base_damage_max: int = 6
@export var base_crit_rate: float = 5.0  # percent
@export var base_fluctuation: int = 2    # ±R
@export var dice_count: int = 1          # X in XdY — number of dice rolls

# -- Armor-specific base stats --
@export var base_armor: int = 0
@export var base_block: int = 0          # for shields

# -- Dice socket --
@export var embedded_dice: DiceData = null

# -- Set membership --
@export var set_name: String = ""        # e.g. "knight", "friar"
@export var set_piece: String = ""       # e.g. "hammer", "chestplate"


func can_embed_dice() -> bool:
	return not slot_type in ["ring", "necklace"]  # accessories amplify instead


func get_combat_formula() -> String:
	## Returns the active damage formula as a string like "2d12+5(8)[-3,3]"
	if embedded_dice == null or embedded_dice.is_shattered:
		return "%d~%d (无骰子)" % [base_damage_min, base_damage_max]

	var y = embedded_dice.face_count
	var z = base_damage_min  # base flat damage
	var c = base_crit_rate
	var r = base_fluctuation
	return "%dd%d+%d(%.0f)[-%d,%d]" % [dice_count, y, z, c, r, r]


func calculate_damage() -> int:
	## Calculate actual damage for one attack using the embedded dice formula.
	if embedded_dice == null or embedded_dice.is_shattered:
		return RNG.randi_range(base_damage_min, base_damage_max)

	var raw = RNG.roll_sum(dice_count, embedded_dice.face_count)
	raw += base_damage_min

	# Apply wear penalty
	raw += embedded_dice.get_wear_penalty()

	# Apply fluctuation
	var fluct = RNG.randi_range(-base_fluctuation, base_fluctuation)
	raw += fluct

	# Apply STR bonus (every 5 STR = +1 damage for physical weapons)
	if slot_type == "weapon" or slot_type == "offhand":
		raw += GameState.strength / 5

	return maxi(0, raw)


func is_critical() -> bool:
	## Returns true if this attack is a critical hit.
	var crit_rate = base_crit_rate
	# AGI bonus: every 10 AGI = +1% crit
	crit_rate += GameState.agility / 10.0
	# Check for dice affix bonuses
	if embedded_dice:
		for a in embedded_dice.get_affixes_by_type("embed"):
			crit_rate += a.effect_data.get("crit_bonus", 0)
	return RNG.randf() * 100.0 < crit_rate


func get_description() -> String:
	var desc := "%s [%s] %.1fkg" % [item_name, quality, weight]
	if embedded_dice:
		desc += " ← 嵌入:%s" % embedded_dice.get_description()
	else:
		desc += " [骰槽:空]"
	return desc
