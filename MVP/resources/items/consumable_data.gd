class_name ConsumableData
extends Resource

## Represents a consumable item — potions, scrolls, tools.
## Used in shop, backpack, and event rewards.

@export var item_id: String = ""
@export var item_name: String = ""
@export var description: String = ""
@export var price: int = 0
@export var effect_type: String = ""   # heal/repair/destiny_dice/reveal/lantern
@export var effect_value: int = 0
@export var icon: String = "📦"
@export var weight: float = 0.0


func get_colored_name() -> String:
	return "%s %s" % [icon, item_name]
