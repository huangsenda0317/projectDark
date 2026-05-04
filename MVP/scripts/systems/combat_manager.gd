class_name CombatManager
extends Control

## Orchestrator bridging CombatEngine (rules) and CombatHUD (UI).
## Instantiated as the root of combat.tscn. BoardController adds it to CombatPanel.

signal combat_finished(victory: bool, rewards: Dictionary)

var engine: CombatEngine
@onready var hud: CombatHUD = $CombatHUD

var _stored_intent: Dictionary = {}


func start(enemy: EnemyData) -> void:
	engine = CombatEngine.new()
	add_child(engine)

	engine.combat_victory.connect(_on_victory)
	engine.combat_defeat.connect(_on_defeat)
	engine.combat_fled.connect(_on_fled)
	engine.turn_player_started.connect(_on_player_turn_started)
	engine.phase_changed.connect(hud.show_phase_transition)

	hud.initialize(engine)
	hud.action_attack.connect(_on_attack)
	hud.action_defend.connect(_on_defend)
	hud.action_flee.connect(_on_flee)
	hud.action_skill.connect(_on_skill)
	hud.action_item.connect(_on_item)

	engine.start_combat(enemy)

	_reveal_and_show_intent()
	_refresh_hud()
	show()


func _reveal_and_show_intent() -> void:
	_stored_intent = engine.get_enemy_intent()
	hud.show_intent(_stored_intent)
	EventBus.enemy_intent_revealed.emit(_stored_intent.get("type", ""), _stored_intent.get("value", 0))


func _refresh_hud() -> void:
	hud.update_player_hp(engine.player.get_hp(), engine.player.get_max_hp())
	hud.update_enemy_hp(engine.enemy.current_hp, engine.enemy.enemy_data.max_hp, engine.enemy.enemy_data.enemy_name)
	hud.update_ap(engine.current_ap, engine.max_ap)


## -- Player action handlers --

func _on_attack() -> void:
	if engine.state != CombatEngine.CombatState.PLAYER_TURN:
		return
	var result = engine.player_attack()
	if not result.is_empty():
		var dmg = result.get("damage_dealt", 0)
		hud.add_log("攻击造成 %d 点伤害" % dmg)
	_refresh_hud()
	_check_enemy_turn()


func _on_defend() -> void:
	if engine.state != CombatEngine.CombatState.PLAYER_TURN:
		return
	var result = engine.player_defend()
	if not result.is_empty():
		var shield = result.get("shield_gained", 0)
		hud.add_log("防御获得 %d 点护盾" % shield)
	_refresh_hud()
	_check_enemy_turn()


func _on_skill(skill_name: String) -> void:
	if engine.state != CombatEngine.CombatState.PLAYER_TURN:
		return
	var result = engine.player_use_skill(skill_name)
	if not result.is_empty():
		hud.add_log("%s 造成 %d 点伤害" % [result.get("skill", "技能"), result.get("damage_dealt", 0)])
	_refresh_hud()
	_check_enemy_turn()


func _on_item(_item_data: Resource) -> void:
	if engine.state != CombatEngine.CombatState.PLAYER_TURN:
		return
	# MVP items in combat are limited; function exists for future expansion
	engine.player_use_item(_item_data)
	_refresh_hud()
	_check_enemy_turn()


func _on_flee() -> void:
	if engine.state != CombatEngine.CombatState.PLAYER_TURN:
		return
	var result = engine.player_flee()
	if not result.is_empty():
		hud.add_log(result.get("message", ""))
		if result.get("enemy_turn_triggered", false):
			# Flee failed — enemy gets a free turn
			hud.set_action_buttons_enabled(false)
			await get_tree().create_timer(0.6).timeout
			_execute_enemy_turn()
	_refresh_hud()


func _on_fled() -> void:
	hud.add_log("成功逃离战斗!")
	hud.set_action_buttons_enabled(false)
	await get_tree().create_timer(1.0).timeout
	combat_finished.emit(false, {"fled": true})


## -- Turn flow --

func _check_enemy_turn() -> void:
	if engine.state == CombatEngine.CombatState.ENEMY_TURN:
		_execute_enemy_turn()


func _execute_enemy_turn() -> void:
	hud.set_action_buttons_enabled(false)
	await get_tree().create_timer(0.8).timeout

	var result = engine.execute_enemy_turn(_stored_intent)
	if not result.is_empty():
		if result.has("damage_dealt"):
			hud.add_log("敌人攻击造成 %d 点伤害" % result["damage_dealt"])
		elif result.has("enemy_shield"):
			hud.add_log("敌人防御获得 %d 点护盾" % result["enemy_shield"])

	_refresh_hud()


func _on_player_turn_started() -> void:
	_reveal_and_show_intent()
	_refresh_hud()


## -- Victory / Defeat --

func _on_victory(rewards: Dictionary) -> void:
	hud.add_log("战斗胜利!")
	hud.set_action_buttons_enabled(false)
	await get_tree().create_timer(1.5).timeout
	combat_finished.emit(true, rewards)


func _on_defeat() -> void:
	hud.add_log("战败...")
	hud.set_action_buttons_enabled(false)
	await get_tree().create_timer(1.5).timeout
	combat_finished.emit(false, {})
