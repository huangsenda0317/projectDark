class_name BoardGenerator
extends Node

## Generates the circular board layout for each floor.
## Tile distribution follows GDD ratio: combat 40%, event 20%, shop 10%, prayer 10%, treasure 8%, trap 7%, boss 1, stair 1.

const TILE_TYPES: Dictionary = {
	"combat": {"weight": 40, "icon": "⚔️"},
	"event":  {"weight": 20, "icon": "❓"},
	"shop":   {"weight": 10, "icon": "🏪"},
	"prayer": {"weight": 10, "icon": "🕯️"},
	"treasure": {"weight": 8, "icon": "📦"},
	"trap":   {"weight": 7, "icon": "🔥"},
}

var current_board: Array = []    # Array of BoardTileData
var board_size: int = 20


func generate_floor(floor_number: int, tower_level: int) -> Array:
	## Generate a new board for the given floor. Returns Array of BoardTileData.
	board_size = _calculate_board_size(floor_number, tower_level)
	current_board.clear()

	# Reserve 1 boss tile + 1 stair tile, distribute the rest
	var regular_count = board_size - 2

	# Build weighted pool
	var types: Array = []
	var weights: Array = []
	for tile_type in TILE_TYPES:
		types.append(tile_type)
		weights.append(TILE_TYPES[tile_type]["weight"])

	var tile_list: Array = []
	for i in regular_count:
		var idx = RNG.weighted_pick(types, weights)
		tile_list.append(types[idx])

	# Shuffle
	RNG.shuffle(tile_list)

	# Insert boss and stair at random positions (not adjacent)
	var boss_pos = RNG.randi_range(0, regular_count)
	tile_list.insert(boss_pos, "boss")
	# Stair position: at least 3 tiles away from boss
	var stair_pos: int
	while true:
		stair_pos = RNG.randi_range(0, tile_list.size())
		if absi(stair_pos - boss_pos) >= 3:
			break
	tile_list.insert(stair_pos, "stair")

	# Create BoardTileData array
	for i in tile_list.size():
		var td = BoardTileData.new()
		td.tile_index = i
		td.tile_type = tile_list[i]
		td.is_revealed = false
		td.is_triggered = false
		current_board.append(td)

	EventBus.board_generated.emit(current_board.size())
	return current_board


func _calculate_board_size(floor: int, tower_level: int) -> int:
	## Per GDD 7.1 table, MVP Lv.1 tower: 18-22 base, varying by floor.
	var base := 18
	if tower_level <= 2:
		if floor == 1:          base = 18
		elif floor <= 3:        base = 20
		elif floor <= 6:        base = 22
	elif tower_level <= 4:
		if floor == 1:          base = 20
		elif floor <= 3:        base = 22
		elif floor <= 6:        base = 24
	else:
		if floor == 1:          base = 22
		elif floor <= 3:        base = 24
		elif floor <= 6:        base = 26
	# Random variation ±2
	return base + RNG.randi_range(-2, 2)


func get_tile_at(index: int) -> BoardTileData:
	if index < 0 or index >= current_board.size():
		return null
	return current_board[index]


func get_boss_tile() -> BoardTileData:
	for td in current_board:
		if td.tile_type == "boss":
			return td
	return null


func get_stair_tile() -> BoardTileData:
	for td in current_board:
		if td.tile_type == "stair":
			return td
	return null


func reveal_tile(index: int) -> void:
	var td = get_tile_at(index)
	if td:
		td.is_revealed = true


func trigger_tile(index: int) -> void:
	var td = get_tile_at(index)
	if td:
		td.is_triggered = true
		EventBus.tile_triggered.emit(td.tile_type, td.get_trigger_data())


func convert_to_void(index: int) -> void:
	## After a full lap, triggered tiles become void spaces.
	var td = get_tile_at(index)
	if td and td.is_triggered:
		td.tile_type = "void"
		td.is_triggered = false  # can be stepped on again (+1 curse)


func is_floor_cleared() -> bool:
	## Floor is cleared when stair tile is triggered.
	for td in current_board:
		if td.tile_type == "stair" and td.is_triggered:
			return true
	return false
