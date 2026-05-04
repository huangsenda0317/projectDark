extends Control

## Main menu — entry point for the game. Allows starting a new run or loading a saved game.

@onready var title_label: Label = $TitleLabel
@onready var new_game_btn: Button = $NewGameButton
@onready var continue_btn: Button = $ContinueButton
@onready var quit_btn: Button = $QuitButton
@onready var seed_input: LineEdit = $SeedInput


func _ready() -> void:
	DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_MAXIMIZED)
	new_game_btn.pressed.connect(_on_new_game)
	continue_btn.pressed.connect(_on_continue)
	quit_btn.pressed.connect(_on_quit)

	continue_btn.disabled = not SaveManager.has_save()
	EventBus.game_started.emit()


func _on_new_game() -> void:
	var seed_val: int = -1
	var seed_text = seed_input.text.strip_edges()
	if not seed_text.is_empty():
		if seed_text.is_valid_int():
			seed_val = seed_text.to_int()
		else:
			seed_val = seed_text.hash()
	GameState.new_run("sanctum_ruins", seed_val)
	SaveManager.delete_save()
	get_tree().change_scene_to_file("res://scenes/village/village.tscn")


func _on_continue() -> void:
	if SaveManager.load_game():
		if GameState.is_dead:
			get_tree().change_scene_to_file("res://scenes/village/village.tscn")
		else:
			get_tree().change_scene_to_file("res://scenes/board/board.tscn")


func _on_quit() -> void:
	get_tree().quit()
