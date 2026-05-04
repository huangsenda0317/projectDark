class_name EnemyData
extends Resource

## Represents a single enemy type. Used for both normal enemies and bosses.

@export var enemy_id: String = ""
@export var enemy_name: String = ""
@export var is_boss: bool = false
@export var max_hp: int = 30
@export var armor: int = 0

# -- Enemy combat stats --
@export var attack_damage_min: int = 4
@export var attack_damage_max: int = 8
@export var crit_chance: float = 5.0         # percent
@export var speed: int = 5                    # determines turn order

# -- Intent pool (weighted) --
@export var intent_weights: Dictionary = {
	"attack": 50,
	"defend": 25,
	"heavy_attack": 25,
}

# -- Boss phase data (only used if is_boss) --
@export var boss_phases: Array[BossPhaseData] = []

# -- Drops --
@export var exp_reward: int = 5
@export var gold_min: int = 3
@export var gold_max: int = 10
@export var dice_drop_chance: float = 0.10     # 10% base
@export var elite_dice_drop_chance: float = 0.0


func pick_intent(current_hp_percent: float) -> Dictionary:
	## Returns a dictionary {type: "attack", value: 12} based on enemy's intent weights.
	if is_boss and boss_phases.size() > 0:
		return _boss_intent(current_hp_percent)

	var types: Array = []
	var weights: Array = []
	for intent_type in intent_weights:
		types.append(intent_type)
		weights.append(intent_weights[intent_type])

	var idx = RNG.weighted_pick(types, weights)
	var intent_type: String = types[idx]
	var value := 0

	match intent_type:
		"attack":
			value = RNG.randi_range(attack_damage_min, attack_damage_max)
		"defend":
			value = maxi(2, armor / 2)
		"heavy_attack":
			value = RNG.randi_range(attack_damage_max, attack_damage_max * 2)

	return {"type": intent_type, "value": value}


func _boss_intent(hp_percent: float) -> Dictionary:
	# Boss AI: more aggressive at low HP
	var phase_data = boss_phases[0] if hp_percent > 0.5 else boss_phases[-1]
	var types: Array = []
	var weights: Array = []
	for intent_type in phase_data.intent_weights:
		types.append(intent_type)
		weights.append(phase_data.intent_weights[intent_type])

	var idx = RNG.weighted_pick(types, weights)
	var intent_type: String = types[idx]
	var value := RNG.randi_range(attack_damage_min, attack_damage_max)
	if intent_type == "heavy_attack":
		value = RNG.randi_range(attack_damage_max, attack_damage_max * 2)
	if intent_type == "defend":
		value = maxi(2, phase_data.bonus_armor)

	return {"type": intent_type, "value": value}


func roll_gold_reward() -> int:
	return RNG.randi_range(gold_min, gold_max)


func should_drop_dice() -> bool:
	return RNG.randf() < dice_drop_chance
