extends Control
## 极简回合制：普攻、三法术、1 道具；Boss 带简易机制。

var _enemy_name: String = ""
var _enemy_hp: int = 0
var _enemy_max: int = 0
var _enemy_atk: int = 0
var _enemy_armor: int = 0
var _enemy_tag: String = ""
var _boss_data: Dictionary = {}
var _pattern: String = ""
var _turn: int = 0
var _phase2: bool = false

var _player_shield: int = 0
var _log: RichTextLabel


func _ready() -> void:
	var ctx: Dictionary = RunState.combat_context
	if ctx.is_empty():
		_end_return_board()
		return
	_player_shield = RunState.next_combat_armor_bonus
	RunState.next_combat_armor_bonus = 0

	match String(ctx.get("kind", "")):
		"boss":
			var bid: String = String(ctx.get("boss_id", "B04"))
			_boss_data = DataDB.get_boss(bid)
			_enemy_name = String(_boss_data.get("name", bid))
			_enemy_max = int(_boss_data.get("hp", 50))
			_enemy_hp = _enemy_max
			_enemy_atk = int(_boss_data.get("attack", 8))
			_enemy_armor = int(_boss_data.get("armor", 0))
			_enemy_tag = String(_boss_data.get("tag", ""))
			_pattern = String(_boss_data.get("pattern", ""))
		_:
			var eid: String = String(ctx.get("enemy_id", "E27"))
			var ed: Dictionary = DataDB.get_enemy(eid)
			_enemy_name = String(ed.get("name", eid))
			_enemy_max = int(ed.get("hp", 40))
			_enemy_hp = _enemy_max
			_enemy_atk = int(ed.get("attack", 8))
			_enemy_armor = int(ed.get("armor", 0))
			_enemy_tag = String(ed.get("tag", ""))
			_pattern = "basic"

	_build_ui()
	_append_log("遭遇 %s！" % _enemy_name)


func _build_ui() -> void:
	var v: VBoxContainer = VBoxContainer.new()
	v.set_anchors_preset(Control.PRESET_FULL_RECT)
	v.offset_left = 16
	v.offset_top = 16
	v.offset_right = -16
	v.offset_bottom = -16
	add_child(v)

	var title: Label = Label.new()
	title.text = "战斗 — %s" % _enemy_name
	v.add_child(title)

	_log = RichTextLabel.new()
	_log.bbcode_enabled = true
	_log.custom_minimum_size = Vector2(0, 200)
	v.add_child(_log)

	var row1: HBoxContainer = HBoxContainer.new()
	v.add_child(row1)
	var b_atk: Button = Button.new()
	b_atk.text = "普攻"
	b_atk.pressed.connect(_player_attack)
	row1.add_child(b_atk)
	var bs1: Button = Button.new()
	bs1.text = "S01 火刑(15)"
	bs1.pressed.connect(_cast_combat.bind("S01"))
	row1.add_child(bs1)
	var bs2: Button = Button.new()
	bs2.text = "S03 盾(20)"
	bs2.pressed.connect(_cast_combat.bind("S03"))
	row1.add_child(bs2)

	var row2: HBoxContainer = HBoxContainer.new()
	v.add_child(row2)
	for k: String in RunState.consumables.keys():
		if int(RunState.consumables[k]) <= 0:
			continue
		var item: Dictionary = DataDB.get_consumable(k)
		if String(item.get("usable_in", "both")) == "board_only":
			continue
		var bt: Button = Button.new()
		bt.text = "用%s" % k
		bt.pressed.connect(_use_item.bind(String(k)))
		row2.add_child(bt)

	var flee: Button = Button.new()
	flee.text = "撤退(败)"
	flee.pressed.connect(_flee)
	v.add_child(flee)


func _append_log(s: String) -> void:
	_log.append_text("\n" + s)


func _player_attack() -> void:
	var dmg: int = _calc_player_damage()
	_enemy_hp = maxi(0, _enemy_hp - dmg)
	_append_log("你造成 %d 伤害 (敌剩余 %d)" % [dmg, _enemy_hp])
	if _check_win():
		return
	_enemy_turn()


func _calc_player_damage() -> int:
	var raw: int = RunState.get_player_attack_power()
	var wid: String = String(RunState.equipment.get("weapon", ""))
	if _enemy_tag == "church" and wid == "W02":
		var wm: float = float(DataDB.get_equipment("W02").get("tag_church_bonus", 0.1))
		raw = int(round(float(raw) * (1.0 + wm)))
	raw = maxi(1, raw - _enemy_armor / 2)
	return raw


func _cast_combat(sid: String) -> void:
	var sp: Dictionary = DataDB.get_spell(sid)
	var cost: int = int(sp.get("mp_cost", 20))
	if not RunState.spend_mp(cost):
		_append_log("魔力不足")
		return
	match sid:
		"S01":
			var dmg: int = int(round(float(_calc_player_damage()) * 1.25))
			if _enemy_tag == "church":
				dmg = int(round(float(dmg) * 1.2))
			_enemy_hp = maxi(0, _enemy_hp - dmg)
			_append_log("火刑反噬 %d 神圣伤" % dmg)
		"S03":
			_player_shield += int(round(float(RunState.max_hp) * 0.1))
			_append_log("获得护盾 %d" % int(round(float(RunState.max_hp) * 0.1)))
	if _check_win():
		return
	_enemy_turn()


func _use_item(cid: String) -> void:
	if RunState.try_use_consumable_combat(cid):
		_append_log("使用 %s" % cid)
	else:
		_append_log("无法使用")
	if _check_win():
		return
	_enemy_turn()


func _flee() -> void:
	RunState.take_damage(15)
	_end_return_board()


func _enemy_turn() -> void:
	_turn += 1
	var dmg: int = _enemy_atk
	if _pattern == "aoe_every_3" and _turn % 3 == 0:
		dmg += int(_boss_data.get("aoe_damage", 6))
		_append_log("祭司圣火！")
	if _pattern == "exposure_bonus":
		if RunState.exposure > int(_boss_data.get("exposure_thresh", 5)):
			dmg += int(_boss_data.get("bonus_damage", 5))
			_append_log("审判官追击！")
	if _pattern == "two_phase" and not _phase2:
		var th: int = int(round(float(_enemy_max) * float(_boss_data.get("phase_hp_pct", 0.55))))
		if _enemy_hp <= th:
			_phase2 = true
			_enemy_atk += int(_boss_data.get("phase2_atk_bonus", 5))
			_enemy_armor = maxi(0, _enemy_armor - 5)
			_append_log("苦修巨像狂热化！")
	var mitigated: int = RunState.get_player_armor() / 3
	dmg = maxi(1, dmg - mitigated)
	if _player_shield > 0:
		var use: int = mini(_player_shield, dmg)
		_player_shield -= use
		dmg -= use
	RunState.take_damage(dmg)
	_append_log("%s 反击 %d（盾剩%d）" % [_enemy_name, dmg, _player_shield])
	if RunState.hp <= 0 or not RunState.run_active:
		_append_log("倒下……")
		call_deferred("_go_menu_after_delay")


func _check_win() -> bool:
	if _enemy_hp > 0:
		return false
	_append_log("胜利！")
	var ctx: Dictionary = RunState.combat_context.duplicate()
	if String(ctx.get("kind", "")) == "boss":
		RunState.boss_defeated_this_floor = true
		RunState.add_gold(int(_boss_data.get("gold_reward", 20)))
		RunState.add_shards(int(_boss_data.get("shards_reward", 5)))
	else:
		var eid: String = String(ctx.get("enemy_id", "E27"))
		var ed: Dictionary = DataDB.get_enemy(eid)
		RunState.add_gold(int(ed.get("gold_reward", 10)))
		RunState.add_shards(int(ed.get("shards_reward", 2)))
	if ctx.get("unlock_hidden", false) == true:
		var ci: int = int(ctx.get("cell_index", -1))
		if ci >= 0 and ci < RunState.cells.size():
			RunState.cells[ci]["hidden_locked"] = false
	RunState.exposure += 1
	RunState.combat_context.clear()
	call_deferred("_end_return_board")
	return true


func _go_menu_after_delay() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")


func _end_return_board() -> void:
	RunState.combat_context.clear()
	get_tree().change_scene_to_file("res://scenes/board.tscn")
