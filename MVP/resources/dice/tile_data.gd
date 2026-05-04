class_name BoardTileData
extends Resource

## Represents a single tile on the circular board.
## Named BoardTileData to avoid collision with Godot's built-in TileData class.

@export var tile_index: int = 0
@export var tile_type: String = ""       # combat/event/shop/prayer/treasure/trap/boss/stair/void
@export var is_revealed: bool = false
@export var is_triggered: bool = false
@export var custom_data: Dictionary = {}  # For special tile params


func get_display_icon() -> String:
	match tile_type:
		"combat":   return "⚔️"
		"event":    return "❓"
		"shop":     return "🏪"
		"prayer":   return "🕯️"
		"treasure": return "📦"
		"trap":     return "🔥"
		"boss":     return "🗡️"
		"stair":    return "⬆️"
		"void":     return "💀"
	return "·"


func get_display_name() -> String:
	match tile_type:
		"combat":   return "战斗"
		"event":    return "事件"
		"shop":     return "商店"
		"prayer":   return "祈祷所"
		"treasure": return "宝藏"
		"trap":     return "陷阱"
		"boss":     return "BOSS"
		"stair":    return "上楼格"
		"void":     return "虚空"
	return "未知"


func get_trigger_data() -> Dictionary:
	## Returns data needed to process this tile's trigger.
	if custom_data.is_empty():
		return {"tile_type": tile_type, "tile_index": tile_index}
	return custom_data.duplicate(true)
