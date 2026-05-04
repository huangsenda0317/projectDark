class_name EventPanel
extends Control

## Event overlay — shows story text and two choices when player steps on an event tile.
## Loads event data from assets/data/events.json.

signal event_resolved()

@onready var background: ColorRect = $Background
@onready var panel_bg: Panel = $PanelBG
@onready var title_label: Label = $PanelBG/TitleLabel
@onready var narrative_label: Label = $PanelBG/NarrativeLabel
@onready var options_container: HBoxContainer = $PanelBG/OptionsContainer
@onready var result_label: Label = $PanelBG/ResultLabel
@onready var continue_button: Button = $PanelBG/ContinueButton

var _current_event: Dictionary = {}
var _resolved: bool = false


func _ready() -> void:
	continue_button.pressed.connect(_on_continue)
	continue_button.hide()
	hide()


func open_event() -> void:
	_current_event = _pick_random_event()
	if _current_event.is_empty():
		# No events configured, just close
		event_resolved.emit()
		return

	_resolved = false
	title_label.text = _current_event.get("event_name", "事件")
	narrative_label.text = _current_event.get("narrative", "")
	result_label.text = ""
	continue_button.hide()
	_render_options()
	show()


func _pick_random_event() -> Dictionary:
	var file = FileAccess.open("res://assets/data/events.json", FileAccess.READ)
	if file == null:
		return {}
	var data = JSON.parse_string(file.get_as_text())
	file.close()
	if data == null or not data.has("events"):
		return {}
	var events = data.events
	if events.is_empty():
		return {}
	return events[RNG.randi_range(0, events.size() - 1)]


func _render_options() -> void:
	for child in options_container.get_children():
		child.queue_free()

	var options: Array = _current_event.get("options", [])
	for i in options.size():
		var opt = options[i]
		var btn = Button.new()
		btn.text = "%s" % opt.get("text", "选项 %d" % (i + 1))
		btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		btn.custom_minimum_size = Vector2(0, 50)
		btn.pressed.connect(_on_choice.bind(i))
		options_container.add_child(btn)


func _on_choice(index: int) -> void:
	if _resolved:
		return
	_resolved = true

	var options: Array = _current_event.get("options", [])
	if index >= options.size():
		return
	var choice = options[index]

	# Apply costs
	var costs: Dictionary = choice.get("costs", {})
	if costs.has("gold"):
		var delta = costs.gold
		if delta < 0:
			GameState.add_gold(delta)
	if costs.has("faith"):
		var delta = costs.faith
		if delta < 0:
			GameState.set_faith(GameState.faith + delta)
		else:
			GameState.add_faith(delta)
	if costs.has("hp"):
		var delta = costs.hp
		if delta < 0:
			GameState.take_damage(-delta)

	# Apply rewards
	var rewards: Dictionary = choice.get("rewards", {})
	if rewards.has("gold"):
		GameState.add_gold(rewards.gold)
	if rewards.has("faith"):
		GameState.add_faith(rewards.faith)
	if rewards.has("reveal_tiles"):
		_reveal_tiles(rewards.reveal_tiles)
	if rewards.has("random_consumable"):
		var item = _get_random_consumable()
		if item:
			if GameState.backpack.size() < GameState.backpack_capacity:
				GameState.backpack.append(item)
				hint_label_fallback("获得 %s!" % item.item_name)
			else:
				hint_label_fallback("获得 %s，但背包已满..." % item.item_name)
		else:
			hint_label_fallback("获得随机消耗品 — 将在后续版本可用")
	if rewards.has("random_relic"):
		hint_label_fallback("获得随机遗物 — 将在后续版本可用")
	if rewards.has("random_equipment"):
		var eq = _get_random_equipment()
		if eq:
			var owned = false
			for slot in GameState.equipment_slots:
				var existing = GameState.equipment_slots[slot]
				if existing and existing is EquipmentData and existing.item_id == eq.item_id:
					owned = true
					break
			if owned:
				GameState.add_gold(15)
				hint_label_fallback("已拥有%s，获得15金币补偿" % eq.item_name)
			else:
				if GameState.equipment_slots.has(eq.slot_type) and GameState.equipment_slots[eq.slot_type] == null:
					GameState.equip_item(eq, eq.slot_type)
					hint_label_fallback("获得并装备 %s!" % eq.item_name)
				else:
					hint_label_fallback("获得 %s (请手动装备)" % eq.item_name)
		else:
			hint_label_fallback("获得随机装备 — 将在后续版本可用")
	if rewards.has("random_blessing"):
		hint_label_fallback("获得随机祝福 — 将在后续版本可用")

	# Show result
	result_label.text = choice.get("narrative_result", "")
	continue_button.show()

	# Disable option buttons
	for child in options_container.get_children():
		if child is Button:
			child.disabled = true


func _reveal_tiles(count: int) -> void:
	# Signal up to board controller via EventBus
	EventBus.tiles_reveal_requested.emit(count)


func hint_label_fallback(msg: String) -> void:
	# Append message to result text since we don't have a separate hint
	if result_label.text.is_empty():
		result_label.text = msg
	else:
		result_label.text += "\n" + msg


func _get_random_consumable():
	var paths = [
		"res://resources/items/healing_potion.tres",
		"res://resources/items/repair_paste.tres",
		"res://resources/items/destiny_dice.tres",
		"res://resources/items/reveal_crystal.tres",
	]
	return load(paths[RNG.randi_range(0, paths.size() - 1)])


func _get_random_equipment():
	var paths = [
		"res://resources/equipment/knight_set/knight_hammer.tres",
		"res://resources/equipment/knight_set/knight_shield.tres",
		"res://resources/equipment/knight_set/knight_chestplate.tres",
		"res://resources/equipment/knight_set/knight_helmet.tres",
		"res://resources/equipment/knight_set/knight_gauntlets.tres",
		"res://resources/equipment/knight_set/knight_leggings.tres",
	]
	return load(paths[RNG.randi_range(0, paths.size() - 1)])


func _on_continue() -> void:
	hide()
	event_resolved.emit()
