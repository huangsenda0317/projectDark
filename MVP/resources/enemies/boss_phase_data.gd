class_name BossPhaseData
extends Resource

## Data for a single boss phase. Bosses have 2 phases with different intent weights.

@export var phase_name: String = "Phase 1"
@export var hp_threshold: float = 0.5       # switch to next phase at 50% HP
@export var intent_weights: Dictionary = {
	"attack": 40,
	"defend": 20,
	"heavy_attack": 40,
}
@export var bonus_armor: int = 2
@export var special_effect: String = ""     # e.g. "curse_mark", "faith_collapse"
@export var special_value: int = 1
