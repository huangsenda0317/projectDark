class_name BoardHUD
extends Control

## Board HUD — top bar with floor number, currencies, HP, curse, weight, and dice quick info.

@onready var floor_label: Label = $FloorLabel
@onready var gold_label: Label = $GoldLabel
@onready var faith_label: Label = $FaithLabel
@onready var hp_bar: ProgressBar = $HPBar
@onready var hp_label: Label = $HPLabel
@onready var curse_label: Label = $CurseLabel
@onready var weight_label: Label = $WeightLabel
@onready var dice_count_label: Label = $DiceCountLabel
@onready var level_label: Label = $LevelLabel
@onready var xp_bar: ProgressBar = $XPBar
@onready var dice_panel: DicePanel = $"../DicePanel"
@onready var backpack_panel: BackpackPanel = $"../BackpackPanel"
@onready var backpack_btn: Button = $"../BackpackButton"


func _ready() -> void:
	EventBus.gold_changed.connect(_on_gold_changed)
	EventBus.faith_changed.connect(_on_faith_changed)
	EventBus.player_damaged.connect(func(_amount, hp): _update_hp())
	EventBus.player_healed.connect(func(_amount, hp): _update_hp())
	EventBus.weight_changed.connect(_on_weight_changed)
	EventBus.experience_gained.connect(func(_a, _c, _n): _update_xp())
	EventBus.level_up.connect(func(_l): _update_level())
	backpack_btn.pressed.connect(_on_backpack_toggle)
	refresh()


func refresh() -> void:
	var tower_name = GameState.current_tower.tower_name if GameState.current_tower else "???"
	floor_label.text = "%s 第%d层" % [tower_name, GameState.current_floor]
	gold_label.text = "💰 %d" % GameState.gold
	faith_label.text = "✝ %d" % GameState.faith
	curse_label.text = "💀 诅咒:%d" % GameState.curse_level
	_update_hp()
	_update_dice_count()
	_update_weight()
	_update_level()
	_update_xp()


func _update_hp() -> void:
	hp_bar.max_value = GameState.player_max_hp
	hp_bar.value = GameState.player_hp
	hp_label.text = "HP: %d/%d" % [GameState.player_hp, GameState.player_max_hp]
	if GameState.get_weight_status() == "overloaded":
		hp_label.modulate = Color.RED
	else:
		hp_label.modulate = Color.WHITE


func _update_weight() -> void:
	var status = GameState.get_weight_status()
	var status_icon = {"light": "✅", "normal": "⚖️", "heavy": "⚠️", "overloaded": "❌"}.get(status, "⚖️")
	weight_label.text = "%s %.1f/%.1fkg" % [status_icon, GameState.current_weight, GameState.max_weight]
	var status_colors = {"light": Color.GREEN, "normal": Color.WHITE, "heavy": Color.YELLOW, "overloaded": Color.RED}
	weight_label.modulate = status_colors.get(status, Color.WHITE)


func _update_level() -> void:
	level_label.text = "Lv.%d" % GameState.player_level


func _update_xp() -> void:
	xp_bar.max_value = GameState.exp_to_next
	xp_bar.value = GameState.player_exp


func _update_dice_count() -> void:
	var total = GameState.get_all_dice().size()
	dice_count_label.text = "🎲 ×%d" % total


func _on_gold_changed(current: int, _delta: int) -> void:
	gold_label.text = "💰 %d" % current


func _on_faith_changed(current: int, _delta: int) -> void:
	faith_label.text = "✝ %d" % current


func _on_weight_changed(current: float, maximum: float, status: String) -> void:
	_update_weight()


func open_dice_panel() -> void:
	dice_panel.refresh()
	dice_panel.show()


func close_dice_panel() -> void:
	dice_panel.hide()


func _on_backpack_toggle() -> void:
	if backpack_panel.visible:
		backpack_panel.hide()
	else:
		backpack_panel.open_panel()


func show_toast(text: String) -> void:
	var toast = Label.new()
	toast.text = text
	toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast.add_theme_font_size_override("font_size", 20)
	toast.modulate = Color(1, 1, 0.5)
	add_child(toast)
	toast.position = Vector2(size.x * 0.5 - 120, size.y * 0.3)
	toast.size = Vector2(240, 40)

	var tween = create_tween()
	tween.tween_interval(0.8)
	tween.tween_property(toast, "modulate:a", 0.0, 0.5)
	tween.tween_callback(toast.queue_free)
