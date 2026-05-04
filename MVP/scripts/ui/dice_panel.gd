class_name DicePanel
extends Control

## Dice allocation panel — embed/retrieve dice from equipment slots.
## Layout: equipment slots (left) | free dice list (right).
## Drag-and-drop: drag a dice card onto an equipment slot's embed button to embed.

var dice_system: DiceSystem
var selected_dice: DiceData = null

@onready var background: ColorRect = $Background
@onready var panel_bg: Panel = $PanelBG
@onready var title_label: Label = $PanelBG/TitleLabel
@onready var faith_label: Label = $PanelBG/FaithLabel
@onready var dice_grid: GridContainer = $PanelBG/ContentHBox/DiceSection/DiceGrid
@onready var dice_section_title: Label = $PanelBG/ContentHBox/DiceSection/DiceSectionTitle
@onready var slot_grid: GridContainer = $PanelBG/ContentHBox/SlotSection/SlotGrid
@onready var hint_label: Label = $PanelBG/HintLabel
@onready var close_button: Button = $PanelBG/CloseButton


func _ready() -> void:
	dice_system = DiceSystem.new()
	close_button.pressed.connect(_on_close)
	background.gui_input.connect(_on_bg_clicked)
	hide()


func refresh() -> void:
	_clear_grids()
	_render_slot_rows()
	_render_dice_cards()
	_update_faith_display()


func _clear_grids() -> void:
	for child in dice_grid.get_children():
		child.queue_free()
	for child in slot_grid.get_children():
		child.queue_free()


## ============================================================
## Equipment slots (LEFT side)
## ============================================================

const SLOT_NAMES: Dictionary = {
	"weapon": "武器", "offhand": "副手",
	"helmet": "头盔", "chestplate": "胸甲", "gauntlets": "护腕", "leggings": "腿甲",
	"boots": "靴子", "cloak": "披风", "belt": "腰带",
	"ring_1": "戒指1", "ring_2": "戒指2", "necklace": "项链",
}

const NON_EMBEDDABLE = ["ring_1", "ring_2", "necklace"]
const AFFIX_TYPE_COLORS: Dictionary = {"roll": Color.CYAN, "embed": Color.ORANGE, "universal": Color.GREEN}


func _render_slot_rows() -> void:
	for slot in GameState.equipment_slots:
		var row = HBoxContainer.new()
		row.name = "SlotRow_%s" % slot
		var eq = GameState.equipment_slots[slot]
		var slot_name = SLOT_NAMES.get(slot, slot)

		var name_label = Label.new()
		name_label.text = "[%s]" % slot_name
		name_label.custom_minimum_size = Vector2(70, 0)
		row.add_child(name_label)

		var status_label = Label.new()
		if eq and eq is EquipmentData:
			status_label.text = eq.item_name
			if eq.embedded_dice:
				var ed = eq.embedded_dice
				status_label.text += " ← [D%d]%s" % [ed.face_count, ed.quality_to_chinese()]
				if ed.is_shattered:
					status_label.text += "×"
		else:
			status_label.text = "— (空)"
			status_label.modulate = Color(0.4, 0.4, 0.4)
		status_label.custom_minimum_size = Vector2(160, 0)
		row.add_child(status_label)

		var spacer = Control.new()
		spacer.custom_minimum_size = Vector2(10, 0)
		row.add_child(spacer)

		if eq and eq is EquipmentData:
			if eq.embedded_dice:
				var btn = Button.new()
				if GameState.allocation_locked:
					btn.text = "🔒"
					btn.disabled = true
					btn.tooltip_text = "战斗中锁定"
				else:
					btn.text = "取回"
					btn.pressed.connect(_on_retrieve.bind(slot))
				row.add_child(btn)
			elif slot not in NON_EMBEDDABLE:
				var btn = Button.new()
				btn.name = "EmbedBtn_%s" % slot
				if GameState.allocation_locked:
					btn.text = "🔒"
					btn.disabled = true
					btn.tooltip_text = "战斗中锁定"
				else:
					btn.text = "嵌入"
					btn.pressed.connect(_on_embed_clicked.bind(slot))
					_setup_drop_target(btn, slot)
				row.add_child(btn)
		elif slot not in NON_EMBEDDABLE:
			var btn = Button.new()
			btn.text = "—"
			btn.disabled = true
			btn.tooltip_text = "需要先装备此槽位的装备"
			row.add_child(btn)

		slot_grid.add_child(row)


func _setup_drop_target(btn: Button, slot: String) -> void:
	btn.mouse_filter = Control.MOUSE_FILTER_STOP
	btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	var panel: DicePanel = self
	btn.set_drag_forwarding(
		func(_at_position: Vector2): return null,
		func(_at_position: Vector2, data) -> bool: return panel._can_drop_on_slot(data, slot),
		func(_at_position: Vector2, data) -> void: panel._on_dropped_on_slot(data, slot),
	)


func _can_drop_on_slot(data, slot: String) -> bool:
	if GameState.allocation_locked:
		return false
	if not data is Dictionary or data.get("source") != "dice_panel":
		return false
	if slot in NON_EMBEDDABLE:
		return false
	var d: DiceData = data.get("dice")
	if d == null or not dice_system.can_embed(d):
		return false
	var eq = GameState.equipment_slots.get(slot)
	if eq == null or eq.embedded_dice:
		return false
	return true


func _on_dropped_on_slot(data, slot: String) -> void:
	var d: DiceData = data.get("dice")
	if d == null:
		return
	selected_dice = d
	_do_embed(slot)


## ============================================================
## Dice cards (RIGHT side)
## ============================================================

func _render_dice_cards() -> void:
	var free_dice = GameState.dice_box
	dice_section_title.text = "自由骰子 (%d/%d)" % [free_dice.size(), GameState.dice_box_capacity]

	if free_dice.is_empty():
		var empty_label = Label.new()
		empty_label.text = "无骰子\n(村庄可免费领D4白骰)"
		empty_label.modulate = Color(0.5, 0.5, 0.5)
		dice_grid.add_child(empty_label)
		return

	for dice in free_dice:
		var card = _make_dice_card(dice)
		dice_grid.add_child(card)


func _make_dice_card(dice: DiceData) -> Control:
	var card = PanelContainer.new()
	card.size_flags_horizontal = Control.SIZE_FILL

	var vbox = VBoxContainer.new()
	vbox.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(vbox)

	var header = Label.new()
	var quality_color = _quality_color(dice.quality)
	header.text = "[D%d] %s" % [dice.face_count, dice.quality_to_chinese()]
	header.add_theme_color_override("font_color", quality_color)
	vbox.add_child(header)

	if dice.affixes.size() > 0:
		for affix in dice.affixes:
			var affix_label = Label.new()
			affix_label.text = " · %s" % affix.describe()
			affix_label.add_theme_font_size_override("font_size", 12)
			var type_color = AFFIX_TYPE_COLORS.get(affix.affix_type, Color.WHITE)
			affix_label.add_theme_color_override("font_color", type_color)
			vbox.add_child(affix_label)

	var wear_text = Label.new()
	var ratio = float(dice.wear) / float(maxi(dice.max_wear, 1)) * 100
	if dice.is_shattered:
		wear_text.text = "[碎裂] 已失效"
		wear_text.add_theme_color_override("font_color", Color.RED)
	else:
		wear_text.text = "磨损: %d/%d (%d%%)" % [dice.wear, dice.max_wear, int(ratio)]
		if ratio >= 75:
			wear_text.add_theme_color_override("font_color", Color.RED)
		elif ratio >= 50:
			wear_text.add_theme_color_override("font_color", Color.YELLOW)
	vbox.add_child(wear_text)

	var cost_label = Label.new()
	cost_label.text = "嵌入费: ✝%d" % dice.get_embed_cost()
	if GameState.faith < dice.get_embed_cost():
		cost_label.add_theme_color_override("font_color", Color.RED)
	vbox.add_child(cost_label)

	var btn = Button.new()
	if dice == selected_dice:
		btn.text = "▼ 已选中 ▼"
		btn.modulate = Color.YELLOW
		card.modulate = Color(1.0, 1.0, 0.7, 1.0)
	elif dice.is_shattered:
		btn.text = "碎裂不可嵌入"
		btn.disabled = true
		card.modulate = Color(0.4, 0.4, 0.4, 1.0)
	elif GameState.faith < dice.get_embed_cost():
		btn.text = "信仰不足"
		btn.disabled = true
	else:
		btn.text = "选择"
	btn.pressed.connect(_on_dice_selected.bind(dice))
	vbox.add_child(btn)

	# Make non-interactive children transparent to mouse so drag works on the card
	for child in vbox.get_children():
		if not child is Button:
			child.mouse_filter = Control.MOUSE_FILTER_IGNORE

	_setup_drag_source(card, dice)

	return card


func _setup_drag_source(card: Control, dice: DiceData) -> void:
	if dice.is_shattered or GameState.allocation_locked:
		return
	card.mouse_filter = Control.MOUSE_FILTER_STOP
	card.mouse_default_cursor_shape = Control.CURSOR_DRAG
	card.set_drag_forwarding(
		func(_at_position: Vector2) -> Dictionary: return {"dice": dice, "source": "dice_panel"},
		func(_at_position: Vector2, _data) -> bool: return false,
		func(_at_position: Vector2, _data) -> void: pass,
	)


## ============================================================
## Actions
## ============================================================

func _on_dice_selected(dice: DiceData) -> void:
	if GameState.allocation_locked:
		return
	if selected_dice == dice:
		selected_dice = null
	else:
		selected_dice = dice
	refresh()


func _on_embed_clicked(slot: String) -> void:
	if selected_dice == null:
		return
	_do_embed(slot)


func _do_embed(slot: String) -> void:
	if selected_dice == null or GameState.allocation_locked:
		return
	var eq = GameState.equipment_slots[slot]
	if eq == null or not eq is EquipmentData:
		return
	if dice_system.embed_dice(selected_dice, eq):
		selected_dice = null
		refresh()


func _on_retrieve(slot: String) -> void:
	if GameState.allocation_locked:
		return
	var eq = GameState.equipment_slots[slot]
	if eq == null:
		return
	if dice_system.retrieve_dice(eq):
		refresh()


## ============================================================
## Helpers
## ============================================================

func _quality_color(quality: String) -> Color:
	match quality:
		"white":  return Color(0.85, 0.85, 0.85)
		"blue":   return Color(0.3, 0.5, 1.0)
		"purple": return Color(0.7, 0.3, 1.0)
		"gold":   return Color(1.0, 0.8, 0.2)
	return Color.WHITE


func _update_faith_display() -> void:
	faith_label.text = "信仰: ✝%d" % GameState.faith
	var lock_text = " [战斗中锁定!]" if GameState.allocation_locked else ""
	title_label.text = "骰子分配" + lock_text
	if GameState.allocation_locked:
		hint_label.text = "战斗中不可重新分配骰子"
		hint_label.add_theme_color_override("font_color", Color.RED)
	else:
		hint_label.text = "拖拽骰子到装备槽嵌入 | 或选择骰子 → 点击嵌入"
		hint_label.add_theme_color_override("font_color", Color.WHITE)


## ============================================================
## Close
## ============================================================

func _on_close() -> void:
	selected_dice = null
	hide()


func _on_bg_clicked(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		_on_close()
