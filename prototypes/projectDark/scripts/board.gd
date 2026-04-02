extends Control
## 棋盘主场景：30 格、掷骰、事件、上楼、进入战斗。

const RING: int = 30

var _root_vbox: VBoxContainer
var _stats: Label
var _log: RichTextLabel
var _dice_label: Label
var _ring_grid: GridContainer
var _reroll_btn: Button
var _up_btn: Button
var _pause_layer: ColorRect
var _choice_window: Window
var _shop_dialog: Window
var _game_end_label: Label

var _ring_buttons: Array[Button] = []
var _last_roll: int = 0


func _ready() -> void:
	if not RunState.run_active:
		RunState.start_new_run(-1)
	_build_ui()
	RunState.board_changed.connect(_refresh_ring)
	RunState.stats_changed.connect(_refresh_stats)
	RunState.inventory_changed.connect(_on_inv)
	_refresh_stats()
	_refresh_ring()
	_check_end_state()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.keycode:
			KEY_ESCAPE, KEY_P:
				_pause_layer.visible = not _pause_layer.visible
				get_viewport().set_input_as_handled()


func _build_ui() -> void:
	_root_vbox = VBoxContainer.new()
	_root_vbox.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root_vbox.offset_left = 12
	_root_vbox.offset_top = 12
	_root_vbox.offset_right = -12
	_root_vbox.offset_bottom = -12
	add_child(_root_vbox)

	_stats = Label.new()
	_stats.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_root_vbox.add_child(_stats)

	var top_bar: HBoxContainer = HBoxContainer.new()
	_root_vbox.add_child(top_bar)
	var roll_btn: Button = Button.new()
	roll_btn.text = "掷骰 (d6)"
	roll_btn.pressed.connect(_on_roll_pressed)
	top_bar.add_child(roll_btn)
	_reroll_btn = Button.new()
	_reroll_btn.text = "重掷 (C13)"
	_reroll_btn.visible = false
	_reroll_btn.pressed.connect(_on_reroll_pressed)
	top_bar.add_child(_reroll_btn)
	_dice_label = Label.new()
	_dice_label.text = "骰子: —"
	top_bar.add_child(_dice_label)
	_up_btn = Button.new()
	_up_btn.text = "上楼"
	_up_btn.visible = false
	_up_btn.pressed.connect(_on_ascend_pressed)
	top_bar.add_child(_up_btn)

	var spell_bar: HBoxContainer = HBoxContainer.new()
	_root_vbox.add_child(spell_bar)
	var bs1: Button = Button.new()
	bs1.text = "法术 S01(15MP)"
	bs1.pressed.connect(_cast_spell.bind("S01"))
	spell_bar.add_child(bs1)
	var bs2: Button = Button.new()
	bs2.text = "S02 雾行(10MP)"
	bs2.pressed.connect(_cast_spell.bind("S02"))
	spell_bar.add_child(bs2)
	var bs3: Button = Button.new()
	bs3.text = "S03 告解盾(20MP)"
	bs3.pressed.connect(_cast_spell.bind("S03"))
	spell_bar.add_child(bs3)

	var inv_label: Label = Label.new()
	inv_label.name = "InvLabel"
	inv_label.text = "背包："
	_root_vbox.add_child(inv_label)

	var inv_row: HBoxContainer = HBoxContainer.new()
	inv_row.name = "InvRow"
	_root_vbox.add_child(inv_row)

	_ring_grid = GridContainer.new()
	_ring_grid.columns = 6
	_ring_grid.add_theme_constant_override("h_separation", 4)
	_ring_grid.add_theme_constant_override("v_separation", 4)
	_root_vbox.add_child(_ring_grid)

	for i in RING:
		var b: Button = Button.new()
		b.custom_minimum_size = Vector2(56, 36)
		b.disabled = true
		_ring_buttons.append(b)
		_ring_grid.add_child(b)

	_log = RichTextLabel.new()
	_log.bbcode_enabled = true
	_log.custom_minimum_size = Vector2(0, 120)
	_log.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_root_vbox.add_child(_log)

	var home: Button = Button.new()
	home.text = "返回主菜单"
	home.pressed.connect(func(): get_tree().change_scene_to_file("res://scenes/main_menu.tscn"))
	_root_vbox.add_child(home)

	_pause_layer = ColorRect.new()
	_pause_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	_pause_layer.color = Color(0, 0, 0, 0.55)
	_pause_layer.visible = false
	add_child(_pause_layer)
	var pv: VBoxContainer = VBoxContainer.new()
	pv.set_anchors_preset(Control.PRESET_CENTER)
	_pause_layer.add_child(pv)
	var pl: Label = Label.new()
	pl.text = "暂停 · 按 P / Esc 关闭"
	pv.add_child(pl)
	var cont: Button = Button.new()
	cont.text = "继续"
	cont.pressed.connect(func(): _pause_layer.visible = false)
	pv.add_child(cont)

	_game_end_label = Label.new()
	_game_end_label.visible = false
	_game_end_label.add_theme_font_size_override("font_size", 22)
	add_child(_game_end_label)
	_game_end_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_game_end_label.offset_top = 40


func _on_inv() -> void:
	_refresh_inv_row()


func _refresh_inv_row() -> void:
	var row: HBoxContainer = _root_vbox.get_node_or_null("InvRow") as HBoxContainer
	if row == null:
		return
	for c in row.get_children():
		c.queue_free()
	for k: String in RunState.consumables.keys():
		var n: int = int(RunState.consumables[k])
		if n <= 0:
			continue
		var b: Button = Button.new()
		b.text = "%s×%d" % [k, n]
		b.pressed.connect(_use_consumable.bind(String(k)))
		row.add_child(b)


func _use_consumable(cid: String) -> void:
	if RunState.try_use_consumable_board(cid):
		_log.append_text("\n[color=gray]使用道具 %s[/color]" % cid)
	else:
		_log.append_text("\n无法使用 %s" % cid)


func _cast_spell(sid: String) -> void:
	var sp: Dictionary = DataDB.get_spell(sid)
	if sp.is_empty():
		return
	var cost: int = int(sp.get("mp_cost", 99))
	if not RunState.spend_mp(cost):
		_log.append_text("\n魔力不足")
		return
	var cd: int = int(sp.get("cooldown", 0))
	RunState.spell_cooldowns[sid] = cd
	var ref: String = String(sp.get("effect_ref", ""))
	match ref:
		"holy_bolt":
			RunState.bonus_attack_flat += 1
			_log.append_text("\n[火刑反噬] 邪火附体 — 下战前攻 +1（占位）")
		"board_extra_moves":
			var n_extra: int = 2
			var pd: Variant = sp.get("params", {})
			if pd is Dictionary:
				n_extra = int(pd.get("n", 2))
			RunState.bonus_ring_steps += n_extra
			_log.append_text("\n雾行：本轮移动结算后追加 %d 格" % n_extra)
		"shield_barrier":
			var pct: float = 0.1
			var pd2: Variant = sp.get("params", {})
			if pd2 is Dictionary:
				pct = float(pd2.get("shield_pct", 0.1))
			RunState.next_combat_armor_bonus += int(round(float(RunState.max_hp) * pct))
			_log.append_text("\n告解护盾已预备，下场战斗额外护甲。")


func _refresh_stats() -> void:
	_stats.text = "第 %d 层 | HP %d/%d | MP %d/%d | 💰%d | 魂屑%d | 暴露%d | 攻%d 甲%d" % [
		RunState.floor_num, RunState.hp, RunState.max_hp, RunState.mp, RunState.max_mp,
		RunState.gold, RunState.shards, RunState.exposure,
		RunState.get_player_attack_power(), RunState.get_player_armor()
	]
	_check_up_button()
	_check_end_state()


func _check_up_button() -> void:
	var idx: int = RunState.player_index
	if idx < 0 or idx >= RunState.cells.size():
		_up_btn.visible = false
		return
	var cell: Dictionary = RunState.cells[idx]
	var ok_stairs: bool = cell.get("kind", "") == "stairs" or (cell.get("kind", "") == "hidden_stairs" and cell.get("hidden_locked", true) == false)
	_up_btn.visible = ok_stairs and RunState.stairs_accessible()


func _check_end_state() -> void:
	if RunState.victory:
		_game_end_label.text = "胜利！首通已写入 meta · 返回主菜单继续"
		_game_end_label.visible = true
	elif not RunState.run_active and RunState.hp <= 0:
		_game_end_label.text = "你死了…"
		_game_end_label.visible = true
	else:
		_game_end_label.visible = false


func _refresh_ring() -> void:
	for i in RING:
		var b: Button = _ring_buttons[i]
		var cell: Dictionary = RunState.cells[i]
		var rev: bool = cell.get("revealed", false)
		var kind: String = cell.get("kind", "event")
		var icon: String = "?"
		if rev or i == RunState.player_index:
			match kind:
				"stairs":
					icon = "楼"
				"hidden_stairs":
					icon = "隐" if cell.get("hidden_locked", true) else "楼"
				_:
					var ev: Dictionary = DataDB.get_event(String(cell.get("event_id", "")))
					icon = String(ev.get("name", "?")).substr(0, 2)
		else:
			icon = "■"
		if i == RunState.player_index:
			b.text = ">%s" % icon
		else:
			b.text = "%d:%s" % [i, icon]
		if kind == "stairs":
			b.modulate = Color(0.8, 0.9, 1.0)
		elif kind == "hidden_stairs":
			b.modulate = Color(0.9, 0.7, 1.0)
		elif rev and String(cell.get("event_id", "")).begins_with("EV16"):
			b.modulate = Color(1.0, 0.6, 0.6)
		else:
			b.modulate = Color.WHITE
	_refresh_inv_row()


func _on_roll_pressed() -> void:
	if not RunState.run_active or RunState.victory:
		return
	_last_roll = RunState.roll_d6()
	_dice_label.text = "骰子: %d" % _last_roll
	if RunState.dice_rerolls_left > 0:
		_reroll_btn.visible = true
	else:
		_reroll_btn.visible = false
		_apply_move(_last_roll)


func _on_reroll_pressed() -> void:
	if RunState.dice_rerolls_left <= 0:
		return
	RunState.dice_rerolls_left -= 1
	_last_roll = RunState.roll_d6()
	_dice_label.text = "重掷: %d" % _last_roll
	_reroll_btn.visible = false
	_apply_move(_last_roll)


func _apply_move(n: int) -> void:
	RunState.move_player_on_ring(n)
	RunState.reveal_cell(RunState.player_index)
	_refresh_ring()
	if _resolve_cell_chain():
		return
	_time_sand_elite_check()


func _time_sand_elite_check() -> void:
	while RunState.time_sand_counter >= 10:
		RunState.time_sand_counter -= 10
		_log.append_text("\n[时砂] 精英拦路！")
		_start_combat_elite()
		return


func _resolve_cell_chain() -> bool:
	var res: Dictionary = _resolve_cell()
	if res.get("_went_combat", false):
		return true
	if _apply_followups(res):
		return true
	if RunState.bonus_ring_steps > 0:
		var s: int = RunState.bonus_ring_steps
		RunState.bonus_ring_steps = 0
		RunState.move_player_on_ring(s)
		RunState.reveal_cell(RunState.player_index)
		_refresh_ring()
		var res2: Dictionary = _resolve_cell()
		if res2.get("_went_combat", false):
			return true
		if _apply_followups(res2):
			return true
	_refresh_stats()
	_refresh_ring()
	return false


func _apply_followups(res: Dictionary) -> bool:
	if res.get("_went_combat", false):
		return false
	if res.get("force_move", 0) != 0:
		RunState.move_player_on_ring(int(res["force_move"]))
		RunState.reveal_cell(RunState.player_index)
		return _resolve_cell_chain()
	if res.get("teleport", -1) >= 0:
		RunState.player_index = int(res["teleport"])
		RunState.reveal_cell(RunState.player_index)
		return _resolve_cell_chain()
	if int(res.get("move_extra", 0)) != 0:
		RunState.move_player_on_ring(int(res["move_extra"]))
		RunState.reveal_cell(RunState.player_index)
		return _resolve_cell_chain()
	return false


func _resolve_cell() -> Dictionary:
	var idx: int = RunState.player_index
	var cell: Dictionary = RunState.cells[idx]
	var kind: String = cell.get("kind", "event")

	if kind == "stairs" or kind == "hidden_stairs":
		if RunState.is_boss_floor() and not RunState.boss_defeated_this_floor:
			_log.append_text("\n[color=tan]守关者挡路！进入战斗。[/color]")
			_start_combat_boss()
			return {"_went_combat": true}
		if kind == "hidden_stairs" and cell.get("hidden_locked", true):
			return _resolve_event(DataDB.get_event("EV13"), idx)
		return _resolve_event(DataDB.get_event("EV15"), idx)

	var eid: String = String(cell.get("event_id", ""))
	return _resolve_event(DataDB.get_event(eid), idx)


func _resolve_event(evd: Dictionary, idx: int) -> Dictionary:
	var res: Dictionary = EventExecutor.apply(evd, idx)
	_log.append_text("\n[事件] %s — %s" % [evd.get("name", evd.get("event_id", "?")), res.get("msg", "")])
	if res.get("open_shop", false):
		_open_shop()
	var ch: Dictionary = res.get("choice", {})
	if not ch.is_empty():
		_offer_choice(ch)
	var comb: Dictionary = res.get("combat", {})
	if not comb.is_empty():
		RunState.combat_context = comb
		get_tree().change_scene_to_file("res://scenes/combat.tscn")
		res["_went_combat"] = true
	return res


func _start_combat_boss() -> void:
	var bid: String = ""
	match RunState.floor_num:
		4:
			bid = "B04"
		7:
			bid = "B07"
		10:
			bid = "B10"
	RunState.combat_context = {"kind": "boss", "boss_id": bid}
	get_tree().change_scene_to_file("res://scenes/combat.tscn")


func _start_combat_elite() -> void:
	RunState.combat_context = {"kind": "minion", "enemy_id": "E27", "cell_index": -1}
	get_tree().change_scene_to_file("res://scenes/combat.tscn")


func _offer_choice(ch: Dictionary) -> void:
	if _choice_window and is_instance_valid(_choice_window):
		_choice_window.queue_free()
	var dlg: Window = Window.new()
	dlg.title = "救助溃兵"
	dlg.size = Vector2i(420, 160)
	add_child(dlg)
	_choice_window = dlg
	var mv: MarginContainer = MarginContainer.new()
	mv.set_anchors_preset(Control.PRESET_FULL_RECT)
	mv.add_theme_constant_override("margin_left", 12)
	mv.add_theme_constant_override("margin_right", 12)
	mv.add_theme_constant_override("margin_top", 12)
	dlg.add_child(mv)
	var vb: VBoxContainer = VBoxContainer.new()
	mv.add_child(vb)
	var ba: Button = Button.new()
	ba.text = "A: " + str(ch.get("a", ""))
	ba.pressed.connect(func():
		EventExecutor.apply_choice("a")
		dlg.queue_free()
		_log.append_text("\n你选择了 A")
	)
	var bb: Button = Button.new()
	bb.text = "B: " + str(ch.get("b", ""))
	bb.pressed.connect(func():
		EventExecutor.apply_choice("b")
		dlg.queue_free()
		_log.append_text("\n你选择了 B")
	)
	vb.add_child(ba)
	vb.add_child(bb)
	dlg.popup_centered()


func _open_shop() -> void:
	var disc: float = 0.0
	var t2: Dictionary = DataDB.get_equipment(String(RunState.equipment.get("trinket_2", "")))
	if t2.get("shop_discount", 0.0):
		disc = float(t2.get("shop_discount", 0.0))
	disc = maxf(disc, RunState.shop_discount)
	if _shop_dialog:
		_shop_dialog.queue_free()
	_shop_dialog = Window.new()
	_shop_dialog.title = "流浪商贩"
	_shop_dialog.size = Vector2i(320, 220)
	add_child(_shop_dialog)
	var vb: VBoxContainer = VBoxContainer.new()
	_shop_dialog.add_child(vb)
	var items: Array = [
		{"id": "C01", "price": int(25 * (1.0 - disc))},
		{"id": "C03", "price": int(18 * (1.0 - disc))},
		{"id": "C13", "price": int(40 * (1.0 - disc))},
	]
	for it: Dictionary in items:
		var row: HBoxContainer = HBoxContainer.new()
		var lbl: Label = Label.new()
		var cid: String = String(it["id"])
		lbl.text = DataDB.get_consumable(cid).get("name", cid) + " — %d 金" % int(it["price"])
		var buy: Button = Button.new()
		buy.text = "买"
		var p: int = int(it["price"])
		buy.pressed.connect(func():
			if RunState.gold >= p:
				RunState.add_gold(-p)
				RunState.add_consumable(cid, 1)
				_log.append_text("\n购入 %s" % cid)
				_refresh_stats()
		)
		row.add_child(lbl)
		row.add_child(buy)
		vb.add_child(row)
	_shop_dialog.popup_centered()


func _on_ascend_pressed() -> void:
	RunState.ascend_stairs()
	if RunState.victory:
		pass
	_refresh_stats()
	_refresh_ring()
