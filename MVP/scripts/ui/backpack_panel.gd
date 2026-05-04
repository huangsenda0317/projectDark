class_name BackpackPanel
extends Control

## Backpack panel — shows carried items with optional use action.

signal backpack_closed()

@onready var title_label: Label = $PanelBG/TitleLabel
@onready var item_container: VBoxContainer = $PanelBG/ScrollContainer/ItemContainer
@onready var detail_label: Label = $PanelBG/DetailLabel
@onready var use_btn: Button = $PanelBG/UseButton
@onready var close_btn: Button = $PanelBG/CloseButton

var _selected_item: Resource = null


func _ready() -> void:
	close_btn.pressed.connect(func(): hide(); backpack_closed.emit())
	use_btn.pressed.connect(_on_use_item)
	use_btn.disabled = true


func open_panel() -> void:
	_refresh()
	show()


func _refresh() -> void:
	for c in item_container.get_children():
		c.queue_free()

	title_label.text = "背包 (%d/%d)" % [GameState.backpack.size(), GameState.backpack_capacity]
	_selected_item = null
	detail_label.text = ""
	use_btn.disabled = true

	if GameState.backpack.is_empty():
		var empty_label = Label.new()
		empty_label.text = "（空）"
		empty_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		item_container.add_child(empty_label)
		return

	for item in GameState.backpack:
		if not item is Resource:
			continue
		var btn = Button.new()
		btn.text = "%s %s (%.1fkg)" % [item.get("icon") if item.get("icon") else "📦", item.get("item_name") if item.get("item_name") else "???", item.get("weight") if item.get("weight") != null else 0.0]
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.pressed.connect(_on_item_selected.bind(item))
		item_container.add_child(btn)


func _on_item_selected(item: Resource) -> void:
	_selected_item = item
	var desc = item.get("description") if item.get("description") else ""
	var effect = item.get("effect_type") if item.get("effect_type") else ""
	var value = item.get("effect_value") if item.get("effect_value") != null else 0
	detail_label.text = "%s\n效果: %s %d" % [desc, effect, value]
	use_btn.disabled = false


func _on_use_item() -> void:
	if not _selected_item:
		return

	var effect_type: String = _selected_item.get("effect_type") if _selected_item.get("effect_type") != null else ""
	var effect_value: int = _selected_item.get("effect_value") if _selected_item.get("effect_value") != null else 0

	match effect_type:
		"heal":
			GameState.heal(effect_value)
			var item_name: String = _selected_item.get("item_name") if _selected_item.get("item_name") else "道具"
			detail_label.text = "使用了 %s，恢复了 %d HP" % [item_name, effect_value]
		_:
			var item_name: String = _selected_item.get("item_name") if _selected_item.get("item_name") else "道具"
			detail_label.text = "%s 无法在此使用" % item_name

	GameState.backpack.erase(_selected_item)
	_selected_item = null
	use_btn.disabled = true
	await get_tree().create_timer(0.8).timeout
	_refresh()
	EventBus.backpack_changed.emit()
