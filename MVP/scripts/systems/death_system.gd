## DEPRECATED: Death/revival logic has been consolidated into GameState (handle_death, revive_in_village).
## This class is kept for reference only and is not instantiated anywhere in the current codebase.
class_name DeathSystem
extends Node

## Manages player death, punishment, and revival flow.

func trigger_death() -> void:
	## Called when player HP reaches 0 during combat or trap.
	# Punishment logic
	var gold_lost = ceili(GameState.gold * 0.30)
	var faith_lost = ceili(GameState.faith * 0.30)

	GameState.gold -= gold_lost
	GameState.faith -= faith_lost
	GameState.death_gold_dropped = gold_lost
	GameState.death_location = {
		"tower_id": GameState.current_tower_id,
		"floor": GameState.current_floor,
		"tile_index": GameState.current_tile_index,
	}

	# Equipment drop (15% chance, not on consecutive death ≥2)
	if GameState.consecutive_deaths < 2:
		if RNG.randf() < 0.15:
			for slot in ["weapon", "chestplate", "helmet", "offhand"]:
				var eq = GameState.equipment_slots.get(slot)
				if eq:
					GameState.death_equipment_dropped = eq
					GameState.equipment_slots[slot] = null
					EventBus.item_dropped.emit(eq.item_id)
					break

	# Shatter all embedded dice
	for slot in GameState.equipment_slots:
		var eq = GameState.equipment_slots[slot]
		if eq and eq is EquipmentData and eq.embedded_dice:
			eq.embedded_dice.shatter()
			EventBus.dice_shattered.emit(eq.embedded_dice.dice_id)

	GameState.consecutive_deaths += 1
	GameState.is_dead = true
	GameState.update_weight()

	EventBus.player_died.emit()
	SaveManager.auto_save()


func revive_in_village() -> void:
	GameState.is_dead = false
	GameState.player_hp = ceili(GameState.player_max_hp * 0.50)
	GameState.faith = maxi(5, GameState.faith)

	# Unequip all (shattered dice already handled)
	GameState._unequip_all()
	GameState.update_weight()

	EventBus.player_revived.emit("village")


func return_to_death_location() -> bool:
	## Returns true if the death location matches the current tower/floor.
	var loc = GameState.death_location
	if loc.is_empty(): return false
	if loc.get("tower_id") != GameState.current_tower_id: return false
	if loc.get("floor") != GameState.current_floor: return false
	return true


func pickup_death_drop() -> Dictionary:
	## Collect gold and equipment left at the death tile.
	var result := {"gold": 0, "equipment": null}

	if GameState.death_gold_dropped > 0:
		result["gold"] = GameState.death_gold_dropped
		GameState.gold += GameState.death_gold_dropped
		GameState.death_gold_dropped = 0

	if GameState.death_equipment_dropped != null:
		result["equipment"] = GameState.death_equipment_dropped
		GameState.death_equipment_dropped = null

	# Clear death location after pickup
	GameState.death_location.clear()
	return result


func has_death_drop() -> bool:
	return GameState.death_gold_dropped > 0 or GameState.death_equipment_dropped != null
