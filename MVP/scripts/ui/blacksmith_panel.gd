class_name BlacksmithPanel
extends Control

## Blacksmith overlay — repairs shattered or worn dice for gold.

signal blacksmith_closed()

@onready var background: ColorRect = $Background
@onready var panel_bg: Panel = $PanelBG
@onready var title_label: Label = $PanelBG/TitleLabel
@onready var gold_label: Label = $PanelBG/GoldLabel
@onready var dice_container: VBoxContainer = $PanelBG/DiceContainer
@onready var hint_label: Label = $PanelBG/HintLabel
@onready var close_button: Button = $PanelBG/CloseButton


func _ready() -> void:
	close_button.pressed.connect(_on_close)
	background.gui_input.connect(func(e: InputEvent):
		if e is InputEventMouseButton and e.pressed:
			_on_close()
	)
	hide()


func refresh() -> void:
	for child in dice_container.get_children():
		child.queue_free()

	gold_label.text = "💰 %d" % GameState.gold
	title_label.text = "铁匠铺"

	var all_dice = GameState.get_all_dice()
	var has_damaged := false

	for dice in all_dice:
		if not dice.is_shattered and dice.wear <= 0:
			continue
		has_damaged = true

		var row = HBoxContainer.new()
		row.size_flags_horizontal = Control.SIZE_FILL

		var name_label = Label.new()
		var status_text = "碎裂!" if dice.is_shattered else "磨损:%d/%d" % [dice.wear, dice.max_wear]
		name_label.text = "%s [%s]" % [dice.get_description(), status_text]
		name_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(name_label)

		var cost = dice.face_count * 2 if dice.is_shattered else maxi(1, ceili(dice.wear * 0.5))
		var cost_label = Label.new()
		cost_label.text = "%d 💰" % cost
		row.add_child(cost_label)

		var btn = Button.new()
		btn.text = "修复"
		if GameState.gold < cost:
			btn.disabled = true
		btn.pressed.connect(_on_repair.bind(dice, cost))
		row.add_child(btn)

		dice_container.add_child(row)

	if not has_damaged:
		var empty = Label.new()
		empty.text = "没有需要修复的骰子"
		empty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		dice_container.add_child(empty)

	hint_label.text = ""
	show()


func _on_repair(dice: DiceData, cost: int) -> void:
	if GameState.gold < cost:
		return
	GameState.add_gold(-cost)
	dice.repair()
	hint_label.text = "%s 已修复!" % dice.get_description()
	EventBus.dice_repaired.emit(dice.dice_id)
	refresh()


func _on_close() -> void:
	hide()
	blacksmith_closed.emit()
