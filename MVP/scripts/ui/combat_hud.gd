class_name CombatHUD
extends Control

## Combat HUD — shows player/enemy HP, AP bar, intent preview, and action buttons.

signal action_attack()
signal action_defend()
signal action_flee()
signal action_skill(skill_name: String)
signal action_item(item_data: Resource)
signal turn_ended()

var combat_engine: CombatEngine
var enemy_intent: Dictionary = {}

@onready var player_hp_bar: ProgressBar = $PlayerPanel/HPBar
@onready var player_hp_label: Label = $PlayerPanel/HPLabel
@onready var enemy_hp_bar: ProgressBar = $EnemyPanel/HPBar
@onready var enemy_hp_label: Label = $EnemyPanel/HPLabel
@onready var enemy_name_label: Label = $EnemyPanel/NameLabel
@onready var ap_bar: ProgressBar = $ActionPanel/APBar
@onready var ap_label: Label = $ActionPanel/APLabel
@onready var intent_label: Label = $EnemyPanel/IntentLabel
@onready var attack_btn: Button = $ActionPanel/AttackButton
@onready var defend_btn: Button = $ActionPanel/DefendButton
@onready var flee_btn: Button = $ActionPanel/FleeButton
@onready var skill_btn: Button = $ActionPanel/SkillButton
@onready var item_btn: Button = $ActionPanel/ItemButton
@onready var log_label: Label = $LogLabel


func _ready() -> void:
	attack_btn.pressed.connect(func(): action_attack.emit())
	defend_btn.pressed.connect(func(): action_defend.emit())
	flee_btn.pressed.connect(func(): action_flee.emit())
	EventBus.ap_changed.connect(_on_ap_changed)
	EventBus.combat_started.connect(_on_combat_started)


func initialize(engine: CombatEngine) -> void:
	combat_engine = engine


func show_intent(intent: Dictionary) -> void:
	enemy_intent = intent
	match intent.get("type"):
		"attack":       intent_label.text = "⚔️ 攻击 (%d)" % intent.get("value", 0)
		"defend":       intent_label.text = "🛡️ 防御 (+%d 护盾)" % intent.get("value", 0)
		"heavy_attack": intent_label.text = "🔥 强力攻击 (%d)" % intent.get("value", 0)
	intent_label.show()


func update_player_hp(current: int, maximum: int) -> void:
	player_hp_bar.max_value = maximum
	player_hp_bar.value = current
	player_hp_label.text = "HP: %d/%d" % [current, maximum]


func update_enemy_hp(current: int, maximum: int, enemy_name: String = "") -> void:
	enemy_hp_bar.max_value = maximum
	enemy_hp_bar.value = current
	enemy_hp_label.text = "HP: %d/%d" % [current, maximum]
	if enemy_name != "":
		enemy_name_label.text = enemy_name


func update_ap(current: int, maximum: int) -> void:
	ap_bar.max_value = maximum
	ap_bar.value = current
	ap_label.text = "AP: %d/%d" % [current, maximum]


func set_action_buttons_enabled(enabled: bool) -> void:
	attack_btn.disabled = not enabled or combat_engine.current_ap < 1
	defend_btn.disabled = not enabled or combat_engine.current_ap < 1
	flee_btn.disabled = not enabled or combat_engine.current_ap < 2
	skill_btn.disabled = not enabled or combat_engine.current_ap < 2


func add_log(message: String) -> void:
	log_label.text = message + "\n" + log_label.text
	# Keep only last 5 lines
	var lines = log_label.text.split("\n")
	if lines.size() > 5:
		log_label.text = "\n".join(lines.slice(0, 5))


func _on_combat_started(data: Dictionary) -> void:
	update_enemy_hp(data.get("enemy_hp", 30), data.get("enemy_hp", 30), data.get("enemy_name", "???"))
	if data.get("is_boss", false):
		enemy_name_label.add_theme_color_override("font_color", Color.RED)
		enemy_name_label.add_theme_font_size_override("font_size", 18)
	else:
		enemy_name_label.add_theme_color_override("font_color", Color.WHITE)
	var ap = GameState.get_ap_per_turn()
	update_ap(ap, ap)
	log_label.text = "战斗开始！\n"

func show_phase_transition(phase_name: String) -> void:
	log_label.text = "\n!!! %s !!!\n" % phase_name + log_label.text


func _on_ap_changed(current: int, maximum: int) -> void:
	update_ap(current, maximum)
	set_action_buttons_enabled(current > 0)
