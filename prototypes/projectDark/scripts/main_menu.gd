extends Control


func _ready() -> void:
	DataDB.refresh_meta_unlock()


func _on_new_game() -> void:
	DataDB.refresh_meta_unlock()
	RunState.start_new_run(-1)
	get_tree().change_scene_to_file("res://scenes/board.tscn")


func _on_quit() -> void:
	get_tree().quit()
