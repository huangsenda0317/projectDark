class_name ShopPanel
extends Control

## Shop overlay — shows when player steps on a shop tile.
## Displays 3-5 random items; player buys with gold.

signal shop_closed()

@onready var background: ColorRect = $Background
@onready var panel_bg: Panel = $PanelBG
@onready var title_label: Label = $PanelBG/TitleLabel
@onready var gold_label: Label = $PanelBG/GoldLabel
@onready var item_container: VBoxContainer = $PanelBG/ItemContainer
@onready var hint_label: Label = $PanelBG/HintLabel
@onready var close_button: Button = $PanelBG/CloseButton

var _items: Array = []

const SHOP_ITEM_PATHS: Array[String] = [
	"res://resources/items/healing_potion.tres",
	"res://resources/items/repair_paste.tres",
	"res://resources/items/destiny_dice.tres",
	"res://resources/items/reveal_crystal.tres",
	"res://resources/items/guide_lantern.tres",
	"res://resources/items/d4_white_dice.tres",
]

var _item_pool: Array = []  # Array of ConsumableData


func _ready() -> void:
	close_button.pressed.connect(_on_close)
	background.gui_input.connect(func(e: InputEvent):
		if e is InputEventMouseButton and e.pressed:
			_on_close()
	)
	hide()


func open_shop() -> void:
	_generate_items()
	_render()
	gold_label.text = "💰 %d" % GameState.gold
	title_label.text = "商店"
	show()


func _load_pool() -> void:
	if _item_pool.is_empty():
		for p in SHOP_ITEM_PATHS:
			var res = load(p)
			if res:
				_item_pool.append(res)


func _generate_items() -> void:
	_load_pool()
	_items.clear()
	var pool = _item_pool.duplicate()
	pool.shuffle()
	var count = mini(RNG.randi_range(3, 5), pool.size())
	for i in count:
		_items.append(pool[i])


func _render() -> void:
	for child in item_container.get_children():
		child.queue_free()

	for item in _items:
		var row = HBoxContainer.new()
		row.size_flags_horizontal = Control.SIZE_FILL

		var icon = Label.new()
		icon.text = item.icon
		row.add_child(icon)

		var name_label = Label.new()
		name_label.text = "%s — %s" % [item.item_name, item.description]
		name_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(name_label)

		var price_label = Label.new()
		price_label.text = "%d 💰" % item.price
		if GameState.gold < item.price:
			price_label.add_theme_color_override("font_color", Color.RED)
		row.add_child(price_label)

		var btn = Button.new()
		btn.text = "购买"
		if GameState.gold < item.price:
			btn.disabled = true
			btn.text = "不足"
		btn.pressed.connect(_on_buy.bind(item))
		row.add_child(btn)

		item_container.add_child(row)


func _on_buy(item: ConsumableData) -> void:
	if GameState.gold < item.price:
		return
	GameState.add_gold(-item.price)
	_apply_effect(item)
	gold_label.text = "💰 %d" % GameState.gold
	_render()


func _apply_effect(item: ConsumableData) -> void:
	match item.effect_type:
		"heal":
			GameState.heal(item.effect_value)
			hint_label.text = "恢复了 %d HP!" % item.effect_value
		"repair":
			var repaired = false
			for dice in GameState.get_all_dice():
				if dice.wear > 0 and not dice.is_shattered:
					dice.reduce_wear(item.effect_value)
					hint_label.text = "已修复 %s 磨损 -%d!" % [dice.get_description(), item.effect_value]
					repaired = true
					break
			if not repaired:
				for dice in GameState.get_all_dice():
					if dice.is_shattered:
						dice.repair()
						hint_label.text = "已修复碎裂的 %s!" % dice.get_description()
						repaired = true
						break
			if not repaired:
				GameState.add_gold(item.price)
				hint_label.text = "没有需要修复的骰子，已退款"
		"dice":
			var d = DiceData.new()
			d.dice_id = "d%d_white_shop_%d" % [item.effect_value, randi()]
			d.face_count = item.effect_value
			d.quality = "white"
			d.max_wear = item.effect_value
			d.wear = 0
			if GameState.add_dice(d):
				hint_label.text = "获得 D%d 白骰!" % item.effect_value
			else:
				GameState.add_gold(item.price)
				hint_label.text = "骰子匣已满(容量%d)，金币已退回" % GameState.dice_box_capacity
		"reveal":
			EventBus.tiles_reveal_requested.emit(item.effect_value)
			hint_label.text = "揭示了前方 %d 格!" % item.effect_value
		"lantern":
			EventBus.lantern_used.emit()
			hint_label.text = "灯笼照亮了上楼格的方向!"
		"destiny_dice":
			GameState.destiny_value = 0  # Player picks value in dice selector
			hint_label.text = "下次投骰可选择固定点数(1-6)!"


func _on_close() -> void:
	hide()
	shop_closed.emit()
