class_name AttrPanel
extends Control

## Attribute allocation overlay — opens on level-up so the player can
## spend attribute_points on STR/AGI/INT/CON/FAI.

signal attr_panel_closed()

@onready var background: ColorRect = $Background
@onready var panel_bg: Panel = $PanelBG
@onready var title_label: Label = $PanelBG/TitleLabel
@onready var points_label: Label = $PanelBG/PointsLabel
@onready var attr_container: VBoxContainer = $PanelBG/AttrContainer
@onready var hint_label: Label = $PanelBG/HintLabel
@onready var close_button: Button = $PanelBG/CloseButton

const ATTRS: Array[Dictionary] = [
	{name="STR", key="strength", desc="物理伤害，负重上限"},
	{name="AGI", key="agility", desc="行动力(AP)，暴击率"},
	{name="INT", key="intelligence", desc="法术效能(MVP暂未绑定)"},
	{name="CON", key="constitution", desc="最大HP"},
	{name="FAI", key="faith_attr", desc="信仰获取效率"},
]


func _ready() -> void:
	close_button.pressed.connect(_on_close)
	background.gui_input.connect(func(e: InputEvent):
		if e is InputEventMouseButton and e.pressed:
			_on_close()
	)
	hide()


func open_panel() -> void:
	if GameState.attribute_points <= 0:
		return  # nothing to allocate
	title_label.text = "升级! 属性分配"
	_render()
	show()


func _render() -> void:
	for child in attr_container.get_children():
		child.queue_free()

	points_label.text = "可用点数: %d" % GameState.attribute_points

	for attr in ATTRS:
		var row = HBoxContainer.new()
		row.size_flags_horizontal = Control.SIZE_FILL

		var name_label = Label.new()
		name_label.text = "%s" % attr.name
		name_label.custom_minimum_size = Vector2(60, 0)
		row.add_child(name_label)

		var desc_label = Label.new()
		desc_label.text = attr.desc
		desc_label.custom_minimum_size = Vector2(180, 0)
		desc_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
		row.add_child(desc_label)

		var val_label = Label.new()
		var base_key = "base_" + attr.key
		var effective = GameState.get(attr.key)
		val_label.text = str(effective)
		val_label.custom_minimum_size = Vector2(30, 0)
		row.add_child(val_label)

		var plus_btn = Button.new()
		plus_btn.text = "+"
		plus_btn.custom_minimum_size = Vector2(40, 0)
		plus_btn.disabled = GameState.attribute_points <= 0
		plus_btn.pressed.connect(_on_attr_increase.bind(attr.key, val_label))
		row.add_child(plus_btn)

		attr_container.add_child(row)

	close_button.visible = GameState.attribute_points <= 0
	if GameState.attribute_points <= 0:
		hint_label.text = "点数已用完，请关闭面板"


func _on_attr_increase(attr_key: String, val_label: Label) -> void:
	if GameState.attribute_points <= 0:
		return
	GameState.increment_base_attr(attr_key)
	_render()


func _on_close() -> void:
	hide()
	attr_panel_closed.emit()
