class_name CombatEngine
extends Node

## Core combat engine — manages turn flow, damage calculation, AP consumption, and state effects.
## This is the "rules engine" for combat. Visuals are handled by the combat scene/HUD.

signal combat_victory(rewards: Dictionary)
signal combat_defeat()
signal combat_fled()
signal turn_player_started()
signal turn_enemy_started()
signal phase_changed(phase_name: String)

enum CombatState { INACTIVE, PLAYER_TURN, ENEMY_TURN, VICTORY, DEFEAT, FLED }
var state: CombatState = CombatState.INACTIVE

var player: PlayerEntity
var enemy: EnemyEntity
var current_ap: int
var max_ap: int
var turn_number: int = 0
var current_boss_phase: int = 0

# Ongoing status effects
var player_statuses: Array = []
var enemy_statuses: Array = []


func start_combat(enemy_data: EnemyData) -> void:
	player = PlayerEntity.new()
	player.reset_shield()
	enemy = EnemyEntity.new()
	enemy.initialize(enemy_data)

	max_ap = GameState.get_ap_per_turn()
	current_ap = max_ap
	turn_number = 0
	current_boss_phase = 0
	player_statuses.clear()
	enemy_statuses.clear()
	state = CombatState.PLAYER_TURN

	EventBus.combat_started.emit({
		"enemy_name": enemy_data.enemy_name,
		"enemy_hp": enemy_data.max_hp,
		"is_boss": enemy_data.is_boss,
	})


func get_enemy_intent() -> Dictionary:
	return enemy.get_intent()


## -- Player actions --

func player_attack() -> Dictionary:
	## Returns {damage_dealt, was_critical}
	if state != CombatState.PLAYER_TURN or current_ap < 1:
		return {}
	current_ap -= 1
	EventBus.ap_changed.emit(current_ap, max_ap)

	var damage = player.perform_attack()
	var actual = enemy.take_damage(damage)

	_check_boss_phase()
	_apply_on_hit_effects(enemy, actual)

	if enemy.is_dead():
		_on_victory()
	else:
		_check_turn_end()

	return {"damage_dealt": actual, "raw_damage": damage}


func player_defend() -> Dictionary:
	if state != CombatState.PLAYER_TURN or current_ap < 1:
		return {}
	current_ap -= 1
	EventBus.ap_changed.emit(current_ap, max_ap)

	var shield = player.perform_defend()
	_check_turn_end()
	return {"shield_gained": shield}


func player_use_skill(skill_name: String) -> Dictionary:
	## Knight set skills and other active abilities — cost 2 AP.
	if state != CombatState.PLAYER_TURN or current_ap < 2:
		return {}
	current_ap -= 2
	EventBus.ap_changed.emit(current_ap, max_ap)

	match skill_name:
		"holy_charge":
			if not SetBonusManager or SetBonusManager.count_set_pieces("knight") < 4:
				_check_turn_end()
				return {"skill": "神圣冲锋", "damage_dealt": 0, "blocked": true}
			var weapon = GameState.equipment_slots.get("weapon")
			var face = 0
			if weapon and weapon is EquipmentData and weapon.embedded_dice:
				face = weapon.embedded_dice.face_count
			var dmg = GameState.strength * 3 + face
			enemy.take_damage(dmg)
			_check_boss_phase()
			_check_turn_end()
			return {"skill": "神圣冲锋", "damage_dealt": dmg}
		_:
			_check_turn_end()
			return {}


func player_use_item(item_data: Resource) -> Dictionary:
	if state != CombatState.PLAYER_TURN or current_ap < 1:
		return {}
	current_ap -= 1
	EventBus.ap_changed.emit(current_ap, max_ap)
	# Item effects handled by the item resource
	_check_turn_end()
	var item_name = item_data.get("item_name") if item_data.get("item_name") else ""
	return {"item_used": item_name}


func player_flee() -> Dictionary:
	## Returns {fled: bool, message: String}. Costs 2 AP.
	## On failure, enemy gets a free turn and this returns the enemy result.
	if state != CombatState.PLAYER_TURN or current_ap < 2:
		return {"fled": false, "message": "无法逃跑"}
	current_ap -= 2
	EventBus.ap_changed.emit(current_ap, max_ap)

	var chance = _calculate_flee_chance()
	var roll = RNG.randi_range(1, 100)
	if roll <= chance:
		state = CombatState.FLED
		combat_fled.emit()
		EventBus.combat_ended.emit(false, {"fled": true})
		return {"fled": true, "message": "逃跑成功! (概率 %d%%, 投出 %d)" % [chance, roll]}
	else:
		var msg = "逃跑失败! (概率 %d%%, 投出 %d) — 敌人获得额外回合" % [chance, roll]
		_end_player_turn()
		return {"fled": false, "message": msg, "enemy_turn_triggered": true}


func _calculate_flee_chance() -> int:
	var agi = GameState.agility
	var is_boss = enemy.enemy_data.is_boss
	var curse = GameState.curse_level
	var chance: int = 50 + agi * 5
	if is_boss:
		chance -= 25
	chance -= curse * 3
	return clampi(chance, 5, 95)


## -- Enemy turn --

func execute_enemy_turn(intent: Dictionary) -> Dictionary:
	if state != CombatState.ENEMY_TURN:
		return {}

	var result := {}
	match intent.get("type", "attack"):
		"attack":
			var dmg = intent.get("value", 5)
			var shield = 0
			result["damage_dealt"] = player.take_hit(dmg, shield)
		"defend":
			enemy.add_shield(intent.get("value", 3))
			result["enemy_shield"] = enemy.current_shield
		"heavy_attack":
			var dmg = intent.get("value", 10)
			result["damage_dealt"] = player.take_hit(dmg, 0)

	if player.is_dead():
		_on_defeat()
	else:
		_start_player_turn()

	return result


## -- Turn management --

func _check_turn_end() -> void:
	if current_ap <= 0:
		_end_player_turn()


func _end_player_turn() -> void:
	state = CombatState.ENEMY_TURN
	turn_number += 1
	_tick_statuses()
	EventBus.turn_ended.emit("player")
	EventBus.turn_started.emit("enemy")


func _start_player_turn() -> void:
	state = CombatState.PLAYER_TURN
	max_ap = GameState.get_ap_per_turn()
	# Apply status AP modifiers
	var bonus = 0
	for s in player_statuses:
		if s.get("type") == "lightness":
			bonus += 2
		elif s.get("type") == "heaviness":
			bonus -= 1
	current_ap = maxi(1, max_ap + bonus)
	# Knight set 2-piece: auto armor per turn
	var auto_armor = SetBonusManager.get_auto_armor("knight") if SetBonusManager else 0
	if auto_armor > 0:
		player.add_shield(auto_armor)
	# Boss phase effects
	_apply_boss_phase_effects()
	EventBus.ap_changed.emit(current_ap, max_ap)
	EventBus.turn_ended.emit("enemy")
	EventBus.turn_started.emit("player")
	turn_player_started.emit()


## -- Status effects --

func add_player_status(status_type: String, duration: int, value: int = 0) -> void:
	player_statuses.append({"type": status_type, "duration": duration, "value": value})


func add_enemy_status(status_type: String, duration: int, value: int = 0) -> void:
	enemy_statuses.append({"type": status_type, "duration": duration, "value": value})


func _check_boss_phase() -> void:
	if not enemy or not enemy.enemy_data.is_boss:
		return
	var phases = enemy.enemy_data.boss_phases
	if phases.is_empty() or current_boss_phase >= phases.size() - 1:
		return
	var hp_pct = enemy.get_hp_percent()
	var threshold = phases[current_boss_phase].hp_threshold
	if hp_pct <= threshold:
		current_boss_phase += 1
		var pd = phases[current_boss_phase]
		enemy.current_armor = enemy.enemy_data.armor + pd.bonus_armor
		phase_changed.emit(pd.phase_name)


func _apply_boss_phase_effects() -> void:
	if not enemy or not enemy.enemy_data.is_boss:
		return
	var phases = enemy.enemy_data.boss_phases
	if phases.is_empty() or current_boss_phase >= phases.size():
		return
	var pd = phases[current_boss_phase]
	match pd.special_effect:
		"curse_mark":
			add_player_status("curse_mark", 5, pd.special_value)
		"faith_collapse":
			var loss = pd.special_value
			GameState.set_faith(maxi(0, GameState.faith - loss))


func _tick_statuses() -> void:
	for arr in [player_statuses, enemy_statuses]:
		var to_remove: Array = []
		for i in arr.size():
			arr[i]["duration"] -= 1
			if arr[i]["duration"] <= 0:
				to_remove.append(arr[i])
			else:
				_apply_status_tick(arr[i])
		for s in to_remove:
			arr.erase(s)


func _apply_status_tick(status: Dictionary) -> void:
	match status.get("type"):
		"blessing": pass  # passive Y+2, applied in damage calc
		"curse_mark": player.take_hit(status.get("value", 1), 0)
		"burn": enemy.take_damage(3)


func _apply_on_hit_effects(target: EnemyEntity, damage: int) -> void:
	# Lifesteal from embedded dice affixes
	var weapon = GameState.equipment_slots.get("weapon")
	if weapon and weapon is EquipmentData and weapon.embedded_dice:
		for affix in weapon.embedded_dice.get_affixes_by_type("embed"):
			if affix.affix_name == "吸血":
				var heal_amount = ceili(damage * affix.effect_data.get("lifesteal_percent", 10) / 100.0)
				player.heal_hp(heal_amount)
			elif affix.affix_name == "灼热":
				var fire_dmg = ceili(weapon.embedded_dice.face_count * affix.effect_data.get("fire_damage_ratio", 0.5))
				target.take_damage(fire_dmg)


func _on_victory() -> void:
	state = CombatState.VICTORY
	var is_boss = enemy.enemy_data.is_boss
	var rewards := {
		"exp": enemy.get_reward_exp(),
		"gold": enemy.get_reward_gold(),
		"dice_dropped": enemy.should_drop_dice(),
	}
	if is_boss:
		rewards["dice_dropped"] = true
		rewards["gold"] = maxi(rewards["gold"], 20)
		rewards["boss_defeated"] = true
		if RNG.randf() < 0.20:
			rewards["dice_box_expansion"] = true
	combat_victory.emit(rewards)
	EventBus.combat_ended.emit(true, rewards)


func _on_defeat() -> void:
	state = CombatState.DEFEAT
	combat_defeat.emit()
	EventBus.combat_ended.emit(false, {})
