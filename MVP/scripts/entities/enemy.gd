class_name EnemyEntity
extends Node

## Enemy entity — instanced in combat from EnemyData resource.

var enemy_data: EnemyData
var current_hp: int
var current_armor: int
var current_shield: int = 0
var status_effects: Array = []

signal enemy_died()
signal hp_changed(current: int, maximum: int)


func initialize(data: EnemyData) -> void:
	enemy_data = data
	current_hp = data.max_hp
	current_armor = data.armor


func get_hp_percent() -> float:
	return float(current_hp) / float(maxi(enemy_data.max_hp, 1))


func get_intent() -> Dictionary:
	return enemy_data.pick_intent(get_hp_percent())


func take_damage(amount: int) -> int:
	## Returns actual damage dealt after armor/shield reduction.
	var actual = amount
	# Shield absorbs first
	if current_shield > 0:
		var absorbed = mini(actual, current_shield)
		current_shield -= absorbed
		actual -= absorbed
	# Then armor reduces
	actual = maxi(0, actual - current_armor)
	current_hp = maxi(0, current_hp - actual)
	hp_changed.emit(current_hp, enemy_data.max_hp)

	if current_hp <= 0:
		enemy_died.emit()

	return actual


func add_shield(amount: int) -> void:
	current_shield += amount


func heal(amount: int) -> void:
	current_hp = mini(enemy_data.max_hp, current_hp + amount)
	hp_changed.emit(current_hp, enemy_data.max_hp)


func is_dead() -> bool:
	return current_hp <= 0


func get_reward_exp() -> int:
	return enemy_data.exp_reward


func get_reward_gold() -> int:
	return enemy_data.roll_gold_reward()


func should_drop_dice() -> bool:
	return enemy_data.should_drop_dice()
