class_name FaithSystem
extends Node

## Manages faith points — the core currency for dice embedding, shop purchases, and village upgrades.
## Faith has NO upper limit (v0.4.1), never auto-regenerates, and is shared across tower and village.

func get_faith() -> int:
	return GameState.faith


func add_faith(amount: int, source: String = "") -> void:
	if amount <= 0: return
	GameState.set_faith(GameState.faith + amount)


func spend_faith(amount: int, purpose: String = "") -> bool:
	## Returns false if insufficient faith.
	if GameState.faith < amount:
		return false
	GameState.set_faith(GameState.faith - amount)
	return true


## -- Faith sources (per GDD 12.2) --

func gain_from_prayer() -> int:
	var amount = RNG.randi_range(2, 4)
	# Check for universal affix "虔诚" which gives +1 faith
	for dice in GameState.get_all_dice():
		for affix in dice.get_affixes_by_type("universal"):
			if affix.affix_name == "虔诚":
				amount += affix.effect_data.get("faith_bonus", 1)
	add_faith(amount, "prayer")
	return amount


func gain_from_event(amount: int) -> void:
	add_faith(amount, "event")


func gain_from_enemy() -> void:
	# Defeating亵渎 enemies gives +1 faith
	add_faith(1, "enemy")


func gain_from_run_reward(performance_rating: int) -> int:
	var amount = 5 + performance_rating * 2
	add_faith(amount, "run_reward")
	return amount


## -- Faith costs (per GDD 12.2) --

func cost_embed_dice(dice: DiceData) -> int:
	return dice.get_embed_cost()


func cost_skill_activation(skill_name: String) -> int:
	# Active skills cost 3-8 faith
	match skill_name:
		"holy_charge": return 5
		"divine_revelation": return 8
		"forbidden_ritual": return 6
		"shadow_step": return 3
		"experiment_explosion": return 4
	return 3


func cost_faith_flip() -> int:
	return 3


func cost_dimensional_retrieval() -> int:
	return 2


func cost_set_piece_exchange() -> int:
	return 20


## -- Village faith functions --

func contribute_to_village(amount: int) -> bool:
	if not spend_faith(amount, "village_contribution"):
		return false
	GameState.village_faith += amount
	EventBus.village_contribution.emit(amount, "faith")
	return true


func get_village_faith() -> int:
	return GameState.village_faith


func get_village_resources() -> int:
	return GameState.village_resources
