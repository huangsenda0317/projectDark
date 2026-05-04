class_name WeightSystem
extends Node

## Manages weight calculation, status effects, and backpack capacity.

func calculate_current_weight() -> float:
	var total := 0.0
	# Equipment weight
	for slot in GameState.equipment_slots:
		var eq = GameState.equipment_slots[slot]
		if eq and eq is EquipmentData:
			total += eq.weight
	# Backpack items
	for item in GameState.backpack:
		if item is Resource:
			var item_w = item.get("weight")
			if item_w != null:
				total += item_w
	return total


func calculate_max_weight() -> float:
	var base := 10.0
	base += GameState.strength * 2.0
	# Check universal affixes for weight bonuses
	for dice in GameState.get_all_dice():
		for affix in dice.get_affixes_by_type("universal"):
			if affix.affix_name == "轻负":
				base += affix.effect_data.get("weight_capacity_bonus", 2)
	return base


func get_weight_ratio() -> float:
	return GameState.current_weight / maxi(GameState.max_weight, 1.0)


func get_weight_status() -> String:
	var ratio = get_weight_ratio()
	if ratio <= 0.5: return "light"
	if ratio <= 0.8: return "normal"
	if ratio <= 1.0: return "heavy"
	return "overloaded"


func get_weight_effects() -> Dictionary:
	match get_weight_status():
		"light":       return {"dodge": 10, "step_bonus": 1}
		"normal":      return {}
		"heavy":       return {"initiative_penalty": -20}
		"overloaded":  return {"fatigue": 2, "damage_mult": 0.70}
	return {}


func can_carry(item_weight: float) -> bool:
	return (calculate_current_weight() + item_weight) <= calculate_max_weight()


func add_backpack_item(item: Resource) -> bool:
	if GameState.backpack.size() >= GameState.backpack_capacity:
		return false
	GameState.backpack.append(item)
	GameState.update_weight()
	return true


func remove_backpack_item(index: int) -> bool:
	if index < 0 or index >= GameState.backpack.size():
		return false
	GameState.backpack.remove_at(index)
	GameState.update_weight()
	return true
