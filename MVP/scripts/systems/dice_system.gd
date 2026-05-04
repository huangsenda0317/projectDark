class_name DiceSystem
extends Node

## Manages dice allocation (embed/retrieve), rolling for movement, and dice-specific logic.
## This bridges the UI layer with GameState and DiceData/AffixData resources.

var _pending_roll_dice: DiceData = null
var _pending_roll_result: int = 0
var _pending_raw_roll: int = 0
var _pending_roll_bonuses: Array = []


## -- Embedding / Retrieval --

func embed_dice(dice: DiceData, equipment: EquipmentData) -> bool:
	## Embed a dice into a piece of equipment. Returns false if faith insufficient.
	if equipment == null:
		return false
	if dice.is_shattered:
		push_warning("无法嵌入碎裂骰子: %s" % dice.dice_id)
		return false

	var cost = dice.get_embed_cost()
	if GameState.faith < cost:
		push_warning("信仰不足无法嵌入: 需要%d, 拥有%d" % [cost, GameState.faith])
		return false

	# If equipment already has an embedded dice, retrieve it first
	if equipment.embedded_dice:
		retrieve_dice(equipment)

	# Remove from free dice box
	GameState.remove_dice(dice.dice_id)

	# Embed
	GameState.add_faith(-cost)
	equipment.embedded_dice = dice
	EventBus.dice_embedded.emit(dice.dice_id, equipment.slot_type)
	return true


func retrieve_dice(equipment: EquipmentData) -> bool:
	## Retrieve dice from equipment back to dice box. No faith refund.
	if equipment == null or equipment.embedded_dice == null:
		return false

	var dice = equipment.embedded_dice
	# Check capacity
	if not GameState.add_dice(dice):
		push_warning("骰子匣已满, 无法取回 %s" % dice.dice_id)
		return false

	var slot = equipment.slot_type
	equipment.embedded_dice = null
	EventBus.dice_retrieved.emit(dice.dice_id, slot)
	return true


func can_embed(dice: DiceData) -> bool:
	return not dice.is_shattered and GameState.faith >= dice.get_embed_cost()


func can_retrieve(equipment: EquipmentData) -> bool:
	return equipment != null and equipment.embedded_dice != null and GameState.dice_box.size() < GameState.dice_box_capacity


## -- Movement rolling --

func select_dice_for_move(dice: DiceData) -> void:
	_pending_roll_dice = dice


func roll_for_movement() -> int:
	## Roll the selected dice for movement steps. Returns step count.
	_pending_raw_roll = 0
	_pending_roll_bonuses.clear()

	if _pending_roll_dice == null:
		_pending_raw_roll = 1
		_pending_roll_result = 1
		return 1

	var faces = _pending_roll_dice.face_count
	if faces == 20:
		faces = 10
	if faces == 100:
		return 0

	_pending_raw_roll = RNG.roll_dice(faces)
	_pending_roll_result = _apply_roll_modifiers(_pending_raw_roll)
	EventBus.dice_rolled.emit(_pending_roll_dice.dice_id, _pending_roll_result)
	return _pending_roll_result


func get_last_roll_result() -> int:
	return _pending_roll_result


func get_last_raw_roll() -> int:
	return _pending_raw_roll


func get_last_roll_bonuses() -> Array:
	return _pending_roll_bonuses.duplicate()


func _apply_roll_modifiers(steps: int) -> int:
	## Apply dice affixes, weight status, and other modifiers to movement.
	var modified = steps
	_pending_roll_bonuses.clear()

	if GameState.get_weight_status() == "light":
		modified += 1
		_pending_roll_bonuses.append("轻盈+1")

	if _pending_roll_dice:
		for affix in _pending_roll_dice.get_affixes_by_type("roll"):
			if affix.affix_name == "步数修正":
				var bonus = affix.effect_data.get("step_modifier", 0)
				modified += bonus
				_pending_roll_bonuses.append("步数修正+%d" % bonus)
			elif affix.affix_name == "疾走":
				var bonus = affix.effect_data.get("cw_bonus", 0)
				modified += bonus
				_pending_roll_bonuses.append("疾走+%d" % bonus)

	return maxi(1, modified)


## -- Dice generation (for drops) --

func generate_dice(current_floor: int, tower_level: int) -> DiceData:
	## Generate a random dice for a drop.
	var face = RNG.roll_face_count(current_floor)
	var quality = RNG.roll_quality(tower_level)
	var d = DiceData.new()
	d.dice_id = "d%d_%s_%d" % [face, quality, randi()]
	d.face_count = face
	d.quality = quality
	d.max_wear = face
	d.wear = 0
	d.is_shattered = false

	# Roll affixes based on quality
	var affix_count: int = {"white": 1, "blue": 2, "purple": 3}.get(quality, 1)
	var pool = AffixData.get_affix_pool_for_quality(quality)
	RNG.shuffle(pool)
	for i in mini(affix_count, pool.size()):
		d.affixes.append(pool[i])

	return d


func generate_starter_d4() -> DiceData:
	var d = DiceData.new()
	d.dice_id = "d4_starter_fallback"
	d.face_count = 4
	d.quality = "white"
	d.max_wear = 4
	return d
