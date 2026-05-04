class_name DiceData
extends Resource

## Represents a single dice entity — the core prop of the game.
## Dice drive movement (rolling), combat (embedding), and exploration (special tiles).

@export var dice_id: String = ""
@export var face_count: int = 6          # D4=4, D6=6, D8=8, D10=10, D12=12
@export var quality: String = "white"    # white / blue / purple
@export var affixes: Array[AffixData] = []
@export var wear: int = 0
@export var max_wear: int = 6            # = face_count
@export var is_shattered: bool = false


func roll() -> int:
	## Returns a random roll result for movement. Shattered dice still roll normally.
	return RNG.roll_dice(face_count)


func get_movement_range() -> int:
	## Returns the maximum movement steps (D20 halved, D100 can't move).
	if face_count == 100:
		return 0
	if face_count == 20:
		return 10
	return face_count


func get_embed_cost() -> int:
	## Faith cost to embed this dice: face_count / 3 (floor division).
	return maxi(1, face_count / 3)


func get_wear_penalty() -> int:
	## Returns damage penalty based on wear percentage.
	if is_shattered:
		return -999  # can't be used for combat at all
	var ratio: float = float(wear) / float(maxi(max_wear, 1))
	if ratio >= 0.75: return -2
	if ratio >= 0.50: return -1
	return 0


func accumulate_wear(amount: int = 1) -> void:
	if is_shattered:
		return
	wear = mini(max_wear, wear + amount)
	if wear >= max_wear:
		shatter()


func reduce_wear(amount: int) -> void:
	if is_shattered:
		return
	wear = maxi(0, wear - amount)


func shatter() -> void:
	is_shattered = true
	wear = max_wear


func repair() -> void:
	## Full repair — restores shattered dice to pristine state.
	is_shattered = false
	wear = 0


func get_affixes_by_type(affix_type: String) -> Array[AffixData]:
	## Filters affixes by their trigger type: "roll", "embed", "universal".
	var result: Array[AffixData] = []
	for a in affixes:
		if a.affix_type == affix_type:
			result.append(a)
	return result


func get_description() -> String:
	var desc := "%s (D%d)" % [quality_to_chinese(), face_count]
	if is_shattered:
		desc += " [碎裂]"
	else:
		var ratio := int(float(wear) / float(maxi(max_wear, 1)) * 100)
		desc += " 磨损:%d%%" % ratio
	if affixes.size() > 0:
		desc += " ["
		for i in affixes.size():
			if i > 0: desc += ", "
			desc += affixes[i].affix_name
		desc += "]"
	return desc


func quality_to_chinese() -> String:
	match quality:
		"white": return "白"
		"blue": return "蓝"
		"purple": return "紫"
		"gold": return "金"
	return quality
