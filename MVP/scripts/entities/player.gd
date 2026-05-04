class_name PlayerEntity
extends Node

## Player entity — bridge between GameState and scene nodes.
## This class exposes the GameState player data to the scene tree.

signal hp_changed(current: int, maximum: int)

var current_shield: int = 0
var _death_save_used: bool = false  # Knight 6-piece, once per combat
var _wear_accumulated_dice: Dictionary = {}  # dice_id -> bool, per-combat wear tracking


func get_hp() -> int:
	return GameState.player_hp


func get_max_hp() -> int:
	return GameState.player_max_hp


func get_level() -> int:
	return GameState.player_level


func get_attributes() -> Dictionary:
	return {
		"str": GameState.strength,
		"agi": GameState.agility,
		"int": GameState.intelligence,
		"con": GameState.constitution,
		"fai": GameState.faith_attr,
	}


func get_ap() -> int:
	return GameState.get_ap_per_turn()


func get_weight_status() -> String:
	return GameState.get_weight_status()


func is_dead() -> bool:
	return GameState.is_dead


func add_shield(amount: int) -> void:
	current_shield += amount


func reset_shield() -> void:
	current_shield = 0
	_death_save_used = false
	_wear_accumulated_dice.clear()


## -- Combat action wrappers --

func perform_attack() -> int:
	## Returns damage dealt using main weapon.
	var weapon = GameState.equipment_slots.get("weapon")
	if weapon == null or not weapon is EquipmentData:
		return 1  # bare hands: 1 damage
	if weapon.embedded_dice == null or weapon.embedded_dice.is_shattered:
		return RNG.randi_range(weapon.base_damage_min, weapon.base_damage_max)

	var damage = weapon.calculate_damage()
	if weapon.is_critical():
		damage = ceili(damage * 1.5)

	# Accumulate wear once per combat on the embedded dice
	if weapon.embedded_dice and not _wear_accumulated_dice.get(weapon.embedded_dice.dice_id, false):
		weapon.embedded_dice.accumulate_wear(1)
		_wear_accumulated_dice[weapon.embedded_dice.dice_id] = true
		EventBus.wear_accumulated.emit(weapon.embedded_dice.dice_id, weapon.embedded_dice.wear, weapon.embedded_dice.max_wear)

	return damage


func perform_defend() -> int:
	## Returns shield/armor value gained.
	var chest = GameState.equipment_slots.get("chestplate")
	var shield_val := 0
	if chest and chest is EquipmentData and chest.embedded_dice and not chest.embedded_dice.is_shattered:
		shield_val += chest.embedded_dice.face_count
		if not _wear_accumulated_dice.get(chest.embedded_dice.dice_id, false):
			chest.embedded_dice.accumulate_wear(1)
			_wear_accumulated_dice[chest.embedded_dice.dice_id] = true
			EventBus.wear_accumulated.emit(chest.embedded_dice.dice_id, chest.embedded_dice.wear, chest.embedded_dice.max_wear)

	var offhand = GameState.equipment_slots.get("offhand")
	if offhand and offhand is EquipmentData and offhand.embedded_dice and not offhand.embedded_dice.is_shattered:
		shield_val += offhand.embedded_dice.face_count * offhand.base_block
		if not _wear_accumulated_dice.get(offhand.embedded_dice.dice_id, false):
			offhand.embedded_dice.accumulate_wear(1)
			_wear_accumulated_dice[offhand.embedded_dice.dice_id] = true
			EventBus.wear_accumulated.emit(offhand.embedded_dice.dice_id, offhand.embedded_dice.wear, offhand.embedded_dice.max_wear)

	return shield_val


func take_hit(damage: int, shield: int) -> int:
	## Apply damage after shield and tough affix armor bonus. Returns actual HP lost.
	var absorbed_by_self = mini(current_shield, damage)
	current_shield -= absorbed_by_self
	var total_shield = shield + absorbed_by_self
	var armor_bonus = _get_armor_from_affixes()
	var actual = maxi(0, damage - total_shield - armor_bonus)
	# Knight set 6-piece: death save (once per combat)
	if actual >= GameState.player_hp and SetBonusManager and SetBonusManager.has_set_bonus("knight", "death_save") and not _death_save_used:
		actual = GameState.player_hp - 1  # survive with 1 HP
		_death_save_used = true
	GameState.take_damage(actual)
	hp_changed.emit(GameState.player_hp, GameState.player_max_hp)
	return actual


func _get_armor_from_affixes() -> int:
	var bonus = 0
	var armor_slots = ["chestplate", "helmet", "gauntlets", "leggings", "boots"]
	for slot in armor_slots:
		var eq = GameState.equipment_slots.get(slot)
		if eq and eq is EquipmentData and eq.embedded_dice and not eq.embedded_dice.is_shattered:
			for affix in eq.embedded_dice.get_affixes_by_type("embed"):
				if affix.affix_name == "坚韧":
					bonus += affix.effect_data.get("armor_bonus", 2)
	return bonus


func heal_hp(amount: int) -> void:
	GameState.heal(amount)
	hp_changed.emit(GameState.player_hp, GameState.player_max_hp)
