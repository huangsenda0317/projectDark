class_name VillageUI
extends Control

## Village interface — hub between runs, showing buildings, shops, and upgrade options.

@onready var village_name_label: Label = $VillageNameLabel
@onready var village_level_label: Label = $VillageLevelLabel
@onready var resources_label: Label = $ResourcesLabel
@onready var faith_label: Label = $FaithLabel

@onready var enter_tower_btn: Button = $Buttons/EnterTower
@onready var shop_btn: Button = $Buttons/Shop
@onready var blacksmith_btn: Button = $Buttons/Blacksmith
@onready var contribute_btn: Button = $Buttons/Contribute
@onready var map_btn: Button = $Buttons/MapRoom

@onready var shop_panel: Control = $ShopPanel
@onready var blacksmith_panel: Control = $BlacksmithPanel
@onready var contribute_panel: Control = $ContributePanel


func _ready() -> void:
	enter_tower_btn.pressed.connect(_on_enter_tower)
	shop_btn.pressed.connect(_on_open_shop)
	blacksmith_btn.pressed.connect(_on_open_blacksmith)
	contribute_btn.pressed.connect(_on_open_contribute)
	map_btn.pressed.connect(_on_open_map)

	EventBus.village_contribution.connect(_on_contribution)
	EventBus.village_level_up.connect(_on_level_up)
	refresh()


func refresh() -> void:
	var level_names = {1: "村落", 2: "村庄", 3: "镇子", 4: "城市", 5: "圣城"}
	village_name_label.text = "我的家园"
	village_level_label.text = "等级: %s (Lv.%d)" % [level_names.get(GameState.village_level, "???"), GameState.village_level]
	resources_label.text = "资源: %d" % GameState.village_resources
	faith_label.text = "信仰储量: ✝ %d" % GameState.village_faith

	# Show/hide buildings based on village level
	blacksmith_btn.visible = GameState.village_level >= 2
	map_btn.visible = GameState.village_level >= 3  # requires 镇子

	if GameState.is_dead:
		enter_tower_btn.text = "复活并返回塔中"
	elif not GameState.death_location.is_empty():
		enter_tower_btn.text = "返回塔中(回收遗物)"
	else:
		enter_tower_btn.text = "出发进塔"


func _on_enter_tower() -> void:
	if GameState.is_dead:
		GameState.revive_in_village()
		get_tree().change_scene_to_file("res://scenes/board/board.tscn")
		return
	EventBus.run_started.emit()
	get_tree().change_scene_to_file("res://scenes/board/board.tscn")


func _on_open_shop() -> void:
	shop_panel.open_shop()
	# shop_panel handles its own show()


func _on_open_blacksmith() -> void:
	if GameState.village_level < 2:
		return
	blacksmith_panel.refresh()
	blacksmith_panel.show()


func _on_open_contribute() -> void:
	contribute_panel.refresh()


func _on_open_map() -> void:
	_show_toast("世界地图尚未开放")


const LEVEL_UP_THRESHOLDS: Dictionary = {
	2: {"resources": 50, "faith": 20},
	3: {"resources": 150, "faith": 50},
	4: {"resources": 300, "faith": 100},
	5: {"resources": 500, "faith": 200},
}

func _on_contribution(amount: int, resource_type: String) -> void:
	match resource_type:
		"faith":
			GameState.village_faith += amount
		_:
			GameState.village_resources += amount

	_check_village_level_up()
	refresh()


func _check_village_level_up() -> void:
	var next_level = GameState.village_level + 1
	if not LEVEL_UP_THRESHOLDS.has(next_level):
		return
	var req = LEVEL_UP_THRESHOLDS[next_level]
	if GameState.village_resources >= req["resources"] and GameState.village_faith >= req["faith"]:
		GameState.village_level = next_level
		EventBus.village_level_up.emit(next_level)


func _show_toast(text: String) -> void:
	var toast = Label.new()
	toast.text = text
	toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast.add_theme_font_size_override("font_size", 20)
	toast.modulate = Color(1, 1, 0.5)
	add_child(toast)
	toast.position = Vector2(size.x * 0.5 - 200, size.y * 0.8)
	toast.size = Vector2(400, 40)
	var tween = create_tween()
	tween.tween_interval(1.5)
	tween.tween_property(toast, "modulate:a", 0.0, 0.5)
	tween.tween_callback(toast.queue_free)


func _on_level_up(new_level: int) -> void:
	refresh()
