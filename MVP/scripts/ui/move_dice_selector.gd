class_name MoveDiceSelector
extends Control

## Persistent dice selector anchored to the bottom-left corner.
## Large central dice button rolls for movement; smaller dice buttons
## arranged in a ring switch the active movement dice.

signal roll_complete(steps: int, raw: int, bonuses: Array, direction: int)

var dice_system: DiceSystem
var selected_dice: DiceData = null
var roll_result: int = 0
var current_direction: int = 1  # 0 = CW (顺), 1 = CCW (逆) — default CCW

const RING_RADIUS: float = 52.0
const SMALL_DICE_SIZE: Vector2 = Vector2(30, 30)
const MAIN_DICE_SIZE: Vector2 = Vector2(64, 64)

@onready var main_dice_button: Button = $MainDiceButton
@onready var dice_ring: Control = $DiceRing
@onready var result_label: Label = $ResultLabel
@onready var direction_container: HBoxContainer = $DirectionContainer
@onready var cw_button: Button = $DirectionContainer/CWButton
@onready var ccw_button: Button = $DirectionContainer/CCWButton


func _ready() -> void:
	dice_system = DiceSystem.new()
	main_dice_button.pressed.connect(_on_roll)
	cw_button.pressed.connect(func(): _on_direction(0))
	ccw_button.pressed.connect(func(): _on_direction(1))
	_update_direction_highlight()
	refresh()


func refresh() -> void:
	if dice_ring == null:
		return
	for child in dice_ring.get_children():
		child.queue_free()

	var all_dice = GameState.get_all_dice()
	if all_dice.is_empty():
		var fallback = dice_system.generate_starter_d4()
		GameState.add_dice(fallback)
		all_dice = [fallback]

	if selected_dice == null or not all_dice.has(selected_dice):
		selected_dice = all_dice[0]

	_render_main_dice()
	_render_small_dice(all_dice)


func _render_main_dice() -> void:
	if selected_dice == null:
		return
	main_dice_button.text = "D%d" % selected_dice.face_count
	if selected_dice.is_shattered:
		main_dice_button.modulate = Color(0.5, 0.25, 0.25)
	else:
		match selected_dice.quality:
			"white":  main_dice_button.modulate = Color(0.9, 0.9, 0.9)
			"blue":   main_dice_button.modulate = Color(0.35, 0.55, 1.0)
			"purple": main_dice_button.modulate = Color(0.75, 0.35, 1.0)
			"gold":   main_dice_button.modulate = Color(1.0, 0.82, 0.2)


func _render_small_dice(all_dice: Array) -> void:
	var count = all_dice.size()
	if count <= 1:
		return

	var angle_step = TAU / count
	for i in count:
		var dice: DiceData = all_dice[i]
		var btn = Button.new()
		btn.text = "D%d" % dice.face_count
		btn.custom_minimum_size = SMALL_DICE_SIZE

		var angle = angle_step * i - PI * 0.5
		var cx = dice_ring.size.x * 0.5
		var cy = dice_ring.size.y * 0.5
		btn.position = Vector2(cx + cos(angle) * RING_RADIUS, cy + sin(angle) * RING_RADIUS) - SMALL_DICE_SIZE * 0.5

		if dice == selected_dice:
			btn.modulate = Color.YELLOW
		elif dice.is_shattered:
			btn.modulate = Color(0.5, 0.25, 0.25)

		btn.pressed.connect(_on_dice_switched.bind(dice))
		dice_ring.add_child(btn)


func _on_dice_switched(dice: DiceData) -> void:
	if dice == selected_dice:
		return
	selected_dice = dice
	dice_system.select_dice_for_move(selected_dice)
	refresh()


func _on_roll() -> void:
	if selected_dice == null:
		return

	# Destiny dice active — show picker instead of random roll
	if GameState.destiny_value == 0:
		_show_destiny_picker()
		return

	dice_system.select_dice_for_move(selected_dice)
	roll_result = dice_system.roll_for_movement()

	_finish_roll()


func _finish_roll() -> void:
	var raw = dice_system.get_last_raw_roll()
	var bonuses = dice_system.get_last_roll_bonuses()
	if bonuses.is_empty():
		result_label.text = "🎯 %d 步" % roll_result
	else:
		var bonus_text = " + ".join(bonuses)
		result_label.text = "🎯 %d + (%s) = %d 步" % [raw, bonus_text, roll_result]

	main_dice_button.disabled = true
	roll_complete.emit(roll_result, raw, bonuses, current_direction)


func _show_destiny_picker() -> void:
	# Replace small dice ring with 1-6 destiny buttons
	for child in dice_ring.get_children():
		child.queue_free()

	for i in range(1, 7):
		var btn = Button.new()
		btn.text = str(i)
		btn.custom_minimum_size = SMALL_DICE_SIZE
		var angle = TAU / 6.0 * (i - 1) - PI * 0.5
		var cx = dice_ring.size.x * 0.5
		var cy = dice_ring.size.y * 0.5
		btn.position = Vector2(cx + cos(angle) * RING_RADIUS, cy + sin(angle) * RING_RADIUS) - SMALL_DICE_SIZE * 0.5
		btn.pressed.connect(_on_destiny_chosen.bind(i))
		dice_ring.add_child(btn)

	main_dice_button.text = "选择"
	main_dice_button.disabled = true
	result_label.text = "选择点数 (1-6)"


func _on_destiny_chosen(value: int) -> void:
	GameState.destiny_value = -1  # Consumed
	roll_result = value
	main_dice_button.disabled = true
	result_label.text = "🎯 %d 步 (命运骰)" % value
	roll_complete.emit(value, value, [], current_direction)
	refresh()


func _on_direction(dir: int) -> void:
	current_direction = dir
	_update_direction_highlight()


func _update_direction_highlight() -> void:
	if current_direction == 0:
		cw_button.modulate = Color.YELLOW
		ccw_button.modulate = Color.WHITE
	else:
		ccw_button.modulate = Color.YELLOW
		cw_button.modulate = Color.WHITE


func enable_roll() -> void:
	main_dice_button.disabled = false
	result_label.text = ""
	refresh()
