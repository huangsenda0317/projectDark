class_name TreasurePanel
extends Control

## Treasure overlay — pick one of three rewards when stepping on a treasure tile.
## Options: random equipment, random relic, or gold.

signal treasure_resolved()

@onready var background: ColorRect = $Background
@onready var panel_bg: Panel = $PanelBG
@onready var title_label: Label = $PanelBG/TitleLabel
@onready var options_container: HBoxContainer = $PanelBG/OptionsContainer
@onready var result_label: Label = $PanelBG/ResultLabel
@onready var continue_button: Button = $PanelBG/ContinueButton

var _chosen: bool = false


func _ready() -> void:
	continue_button.pressed.connect(_on_continue)
	continue_button.hide()
	hide()


func open_treasure() -> void:
	_chosen = false
	title_label.text = "发现宝藏!"
	result_label.text = ""
	continue_button.hide()
	_render_options()
	show()


func _render_options() -> void:
	for child in options_container.get_children():
		child.queue_free()

	var choices = [
		{name="装备", desc="随机获得一件装备", icon="⚔️", effect="equipment"},
		{name="遗物", desc="随机获得一个遗物", icon="🏺", effect="relic"},
		{name="金币", desc="获得 15-25 金币", icon="💰", effect="gold"},
	]

	for c in choices:
		var card = VBoxContainer.new()
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		card.mouse_filter = Control.MOUSE_FILTER_IGNORE

		var icon = Label.new()
		icon.text = c.icon
		icon.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		icon.add_theme_font_size_override("font_size", 32)
		card.add_child(icon)

		var name_label = Label.new()
		name_label.text = c.name
		name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		card.add_child(name_label)

		var desc_label = Label.new()
		desc_label.text = c.desc
		desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		desc_label.add_theme_font_size_override("font_size", 11)
		card.add_child(desc_label)

		var btn = Button.new()
		btn.text = "选择"
		btn.pressed.connect(_on_choice.bind(c))
		card.add_child(btn)

		options_container.add_child(card)


func _on_choice(choice: Dictionary) -> void:
	if _chosen:
		return
	_chosen = true

	match choice.effect:
		"equipment":
			_try_grant_random_equipment()
		"relic":
			result_label.text = "获得随机遗物 — 遗物系统将在后续版本实装"
		"gold":
			var amount = RNG.randi_range(15, 25)
			GameState.add_gold(amount)
			result_label.text = "获得 %d 金币!" % amount

	continue_button.show()
	for child in options_container.get_children():
		for sub in child.get_children():
			if sub is Button:
				sub.disabled = true


func _try_grant_random_equipment() -> void:
	var knight_pieces = [
		"knight_hammer", "knight_chestplate", "knight_helmet",
		"knight_leggings", "knight_gauntlets", "knight_shield",
	]
	var piece = knight_pieces[RNG.randi_range(0, knight_pieces.size() - 1)]
	var path = "res://resources/equipment/knight_set/%s.tres" % piece
	if ResourceLoader.exists(path):
		var eq = ResourceLoader.load(path)
		if eq and eq is EquipmentData:
			var slot = eq.slot_type
			if GameState.equipment_slots[slot] == null:
				GameState.equip_item(eq, slot)
				result_label.text = "获得 %s!" % eq.item_name
			elif GameState.backpack.size() < GameState.backpack_capacity:
				GameState.backpack.append(eq)
				result_label.text = "获得 %s (已放入背包)" % eq.item_name
			else:
				GameState.add_gold(10)
				result_label.text = "获得 %s 但背包已满，折为 10 金币" % eq.item_name
			return
	result_label.text = "获得随机装备 — 将在后续版本可用"


func _on_continue() -> void:
	hide()
	treasure_resolved.emit()
