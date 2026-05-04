class_name TileComponent
extends Control

## Visual tile on the circular board. Displays tile type icon, reveals on step,
## and shows player position / reachable states.

var tile_data: BoardTileData
var tile_index: int = -1
var angle: float = 0.0
var is_player_here: bool = false

@onready var icon: Label = $Icon
@onready var highlight: ColorRect = $Highlight
@onready var button: Button = $Button


func setup(data: BoardTileData, idx: int) -> void:
	tile_data = data
	tile_index = idx
	if tile_data.is_revealed:
		reveal()
	else:
		icon.text = "·"
		icon.modulate = Color(0.4, 0.4, 0.4)
	button.pressed.connect(_on_pressed)


func reveal() -> void:
	tile_data.is_revealed = true
	icon.text = tile_data.get_display_icon()
	icon.modulate = Color.WHITE
	if tile_data.is_triggered:
		icon.modulate = Color(0.3, 0.3, 0.3)


func mark_triggered() -> void:
	tile_data.is_triggered = true
	var void_types = ["void"]
	if tile_data.tile_type in void_types:
		icon.text = tile_data.get_display_icon()
	icon.modulate = Color(0.25, 0.25, 0.25)


func set_player_here(here: bool) -> void:
	is_player_here = here
	if here:
		highlight.color = Color(0.2, 1.0, 0.2, 0.5)
		highlight.show()
	else:
		highlight.hide()


func set_highlighted(on: bool) -> void:
	if on and not is_player_here:
		highlight.color = Color(1.0, 1.0, 0.2, 0.35)
		highlight.show()


func set_reachable(on: bool) -> void:
	if on:
		highlight.color = Color(0.3, 0.6, 1.0, 0.45)
		highlight.show()


func set_direction_indicator(on: bool, is_cw: bool = true) -> void:
	if on:
		icon.text = "→" if is_cw else "←"
		icon.modulate = Color.CYAN


func clear_indicators() -> void:
	if is_player_here:
		set_player_here(true)
	elif tile_data.is_revealed:
		reveal()
	else:
		icon.text = "·"
		icon.modulate = Color(0.4, 0.4, 0.4)
	highlight.hide()


func _on_pressed() -> void:
	EventBus.tile_stepped.emit(tile_index, tile_data.tile_type if tile_data.is_revealed else "unknown")
