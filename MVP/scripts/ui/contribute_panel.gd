class_name ContributePanel
extends Control

## Contribution overlay — player donates gold/faith to upgrade the village.

signal contribute_closed()

@onready var background: ColorRect = $Background
@onready var panel_bg: Panel = $PanelBG
@onready var title_label: Label = $PanelBG/TitleLabel
@onready var resources_label: Label = $PanelBG/ResourcesLabel
@onready var faith_label: Label = $PanelBG/FaithLabel
@onready var gold_input: LineEdit = $PanelBG/GoldInput
@onready var contribute_button: Button = $PanelBG/ContributeButton
@onready var hint_label: Label = $PanelBG/HintLabel
@onready var close_button: Button = $PanelBG/CloseButton

var faith_system: FaithSystem
var faith_section: VBoxContainer
var faith_input: LineEdit
var faith_contribute_btn: Button

const RES_NEEDED: int = 50
const FAITH_NEEDED: int = 20


func _ready() -> void:
	close_button.pressed.connect(_on_close)
	contribute_button.pressed.connect(_on_contribute)
	background.gui_input.connect(func(e: InputEvent):
		if e is InputEventMouseButton and e.pressed:
			_on_close()
	)
	faith_system = FaithSystem.new()
	_create_faith_section()
	hide()


func _create_faith_section() -> void:
	faith_section = VBoxContainer.new()
	faith_section.size_flags_horizontal = Control.SIZE_FILL
	panel_bg.add_child(faith_section)
	faith_section.offset_left = 20
	faith_section.offset_top = 300
	faith_section.offset_right = 340
	faith_section.offset_bottom = 340

	var faith_title = Label.new()
	faith_title.text = "贡献信仰 (直接消耗信仰值)"
	faith_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	faith_section.add_child(faith_title)

	var faith_row = HBoxContainer.new()
	faith_section.add_child(faith_row)

	faith_input = LineEdit.new()
	faith_input.placeholder_text = "输入信仰数量"
	faith_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	faith_row.add_child(faith_input)

	faith_contribute_btn = Button.new()
	faith_contribute_btn.text = "贡献信仰"
	faith_contribute_btn.pressed.connect(_on_contribute_faith)
	faith_row.add_child(faith_contribute_btn)


func refresh() -> void:
	title_label.text = "贡献资源"
	resources_label.text = "资源进度: %d/%d" % [GameState.village_resources, RES_NEEDED]
	faith_label.text = "信仰储量: ✝ %d (需%d升级)" % [GameState.village_faith, FAITH_NEEDED]
	gold_input.text = ""
	hint_label.text = "输入金币数量并贡献 (10金币=1资源)"
	show()


func _on_contribute() -> void:
	var amount = int(gold_input.text)
	if amount <= 0:
		hint_label.text = "请输入有效数量"
		return
	if amount > GameState.gold:
		hint_label.text = "金币不足"
		return

	GameState.add_gold(-amount)
	var resources_gained = maxi(1, amount / 10)
	EventBus.village_contribution.emit(resources_gained, "resources")
	hint_label.text = "贡献 %d 金币 → +%d 资源!" % [amount, resources_gained]
	refresh()


func _on_contribute_faith() -> void:
	var amount = int(faith_input.text) if faith_input else 0
	if amount <= 0:
		hint_label.text = "请输入有效信仰数量"
		return
	if amount > GameState.faith:
		hint_label.text = "信仰不足 (当前: \u272d%d)" % GameState.faith
		return
	if faith_system.contribute_to_village(amount):
		hint_label.text = "贡献 \u272d%d 信仰 → 村庄信仰储量 +%d!" % [amount, amount]
		refresh()
	else:
		hint_label.text = "贡献失败"


func _on_close() -> void:
	hide()
	contribute_closed.emit()
