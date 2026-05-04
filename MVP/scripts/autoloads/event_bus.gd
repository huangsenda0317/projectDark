extends Node

## Global signal bus — decouples all module communication.
## Signals are grouped by domain.

# -- Dice lifecycle --
signal dice_rolled(dice_id: String, result: int)
signal dice_embedded(dice_id: String, slot_id: String)
signal dice_retrieved(dice_id: String, slot_id: String)
signal dice_shattered(dice_id: String)
signal dice_repaired(dice_id: String)

# -- Board / movement --
signal direction_chosen(direction: int)  # 0 = CW, 1 = CCW
signal tile_stepped(tile_index: int, tile_type: String)
signal tile_triggered(tile_type: String, data: Dictionary)
signal board_generated(tile_count: int)
signal tiles_reveal_requested(count: int)
signal lantern_used()
signal floor_entered(floor_number: int)
signal lap_completed(extra_curse: int)

# -- Combat --
signal combat_started(enemy_data: Dictionary)
signal combat_ended(victory: bool, rewards: Dictionary)
signal turn_started(entity_name: String)
signal turn_ended(entity_name: String)
signal ap_changed(current: int, maximum: int)
signal enemy_intent_revealed(intent: String, value: int)
signal wear_accumulated(dice_id: String, current_wear: int, max_wear: int)

# -- Player state --
signal player_damaged(amount: int, current_hp: int)
signal player_healed(amount: int, current_hp: int)
signal player_died()
signal player_revived(location: String)
signal experience_gained(amount: int, current: int, needed: int)
signal level_up(new_level: int)
signal attribute_changed(attr: String, new_value: int)
signal faith_changed(current: int, delta: int)
signal gold_changed(current: int, delta: int)
signal weight_changed(current: float, maximum: float, status: String)

# -- Equipment / inventory --
signal backpack_changed()
signal equipment_equipped(item_id: String, slot: String)
signal equipment_unequipped(item_id: String, slot: String)
signal item_picked_up(item_id: String, item_type: String)
signal item_dropped(item_id: String)

# -- Village --
signal village_contribution(amount: int, resource_type: String)
signal village_level_up(new_level: int)
signal villager_recruited(villager_type: String)

# -- Game flow --
signal game_started()
signal run_started()
signal run_ended()
signal game_saved()
signal game_loaded()
