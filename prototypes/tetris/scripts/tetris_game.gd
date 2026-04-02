extends Control
## 俄罗斯方块（Godot 4）— 与网页版相同规则：7-bag、简易踢墙、幽灵块、等级加速。

const COLS: int = 10
const ROWS: int = 20
const CELL: int = 30

const BOARD_BG := Color(0.102, 0.137, 0.196) # #1a2332
const GRID_LINE := Color(1, 1, 1, 0.05)
const GHOST_ALPHA := 0.22

const SHAPES: Dictionary = {
	"I": [
		[Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1), Vector2i(3, 1)],
		[Vector2i(2, 0), Vector2i(2, 1), Vector2i(2, 2), Vector2i(2, 3)],
		[Vector2i(0, 2), Vector2i(1, 2), Vector2i(2, 2), Vector2i(3, 2)],
		[Vector2i(1, 0), Vector2i(1, 1), Vector2i(1, 2), Vector2i(1, 3)],
	],
	"O": [
		[Vector2i(1, 0), Vector2i(2, 0), Vector2i(1, 1), Vector2i(2, 1)],
	],
	"T": [
		[Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1)],
		[Vector2i(1, 0), Vector2i(1, 1), Vector2i(2, 1), Vector2i(1, 2)],
		[Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1), Vector2i(1, 2)],
		[Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(1, 2)],
	],
	"S": [
		[Vector2i(1, 0), Vector2i(2, 0), Vector2i(0, 1), Vector2i(1, 1)],
		[Vector2i(1, 0), Vector2i(1, 1), Vector2i(2, 1), Vector2i(2, 2)],
		[Vector2i(1, 1), Vector2i(2, 1), Vector2i(0, 2), Vector2i(1, 2)],
		[Vector2i(0, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(1, 2)],
	],
	"Z": [
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(1, 1), Vector2i(2, 1)],
		[Vector2i(2, 0), Vector2i(1, 1), Vector2i(2, 1), Vector2i(1, 2)],
		[Vector2i(0, 1), Vector2i(1, 1), Vector2i(1, 2), Vector2i(2, 2)],
		[Vector2i(1, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(0, 2)],
	],
	"J": [
		[Vector2i(0, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1)],
		[Vector2i(1, 0), Vector2i(2, 0), Vector2i(1, 1), Vector2i(1, 2)],
		[Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1), Vector2i(2, 2)],
		[Vector2i(1, 0), Vector2i(1, 1), Vector2i(0, 2), Vector2i(1, 2)],
	],
	"L": [
		[Vector2i(2, 0), Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1)],
		[Vector2i(1, 0), Vector2i(1, 1), Vector2i(1, 2), Vector2i(2, 2)],
		[Vector2i(0, 1), Vector2i(1, 1), Vector2i(2, 1), Vector2i(0, 2)],
		[Vector2i(0, 0), Vector2i(1, 0), Vector2i(1, 1), Vector2i(1, 2)],
	],
}

const COLORS: Dictionary = {
	"I": Color("#00f0f0"),
	"O": Color("#f0f000"),
	"T": Color("#a000f0"),
	"S": Color("#00f000"),
	"Z": Color("#f00000"),
	"J": Color("#0000f0"),
	"L": Color("#f0a000"),
}

const BAG_TYPES: Array[String] = ["I", "O", "T", "S", "Z", "J", "L"]

var _board: Array = []
var _bag: Array[String] = []
var _current: Dictionary = {}
var _next_type: String = ""
var _score: int = 0
var _lines_cleared: int = 0
var _level: int = 1
var _paused: bool = false
var _game_over: bool = false
var _drop_accum: float = 0.0

## 棋盘左上角（像素）
var _board_origin: Vector2 = Vector2(40, 48)

var _font: Font


func _ready() -> void:
	_font = get_theme_default_font()
	if _font == null:
		_font = ThemeDB.fallback_font
	_ensure_input_actions()
	_reset_game()


func _ensure_input_actions() -> void:
	_add_key_action("tetris_left", KEY_LEFT)
	_add_key_action("tetris_right", KEY_RIGHT)
	_add_key_action("tetris_soft_drop", KEY_DOWN)
	_add_key_action("tetris_rotate", KEY_UP)
	_add_key_action("tetris_hard_drop", KEY_SPACE)
	_add_key_action("tetris_pause", KEY_P)
	_add_key_action("tetris_restart", KEY_R)


func _add_key_action(action: StringName, key: Key) -> void:
	if InputMap.has_action(action):
		return
	InputMap.add_action(action, 0.5)
	var ev := InputEventKey.new()
	ev.keycode = key
	ev.physical_keycode = key
	InputMap.action_add_event(action, ev)


func _empty_board() -> void:
	_board.clear()
	for y in ROWS:
		var row: Array = []
		row.resize(COLS)
		for x in COLS:
			row[x] = null
		_board.append(row)


func _refill_bag() -> void:
	_bag = BAG_TYPES.duplicate()
	_bag.shuffle()


func _pull_bag() -> String:
	if _bag.is_empty():
		_refill_bag()
	return _bag.pop_back()


func _spawn_piece(ptype: String) -> Dictionary:
	return {"type": ptype, "rot": 0, "x": 3, "y": 0}


func _piece_cells(ptype: String, rot_index: int) -> Array:
	var rots: Array = SHAPES[ptype]
	var r: int = rot_index % rots.size()
	return rots[r]


func valid_position(p: Dictionary, ox: int, oy: int, new_rot: int = -1) -> bool:
	var rot: int = new_rot if new_rot >= 0 else p.rot
	for c: Vector2i in _piece_cells(p.type, rot):
		var gx: int = p.x + ox + c.x
		var gy: int = p.y + oy + c.y
		if gx < 0 or gx >= COLS or gy >= ROWS:
			return false
		if gy >= 0 and _board[gy][gx] != null:
			return false
	return true


func _try_rotate() -> void:
	if _current.is_empty():
		return
	var rots: Array = SHAPES[_current.type]
	var next_rot: int = (_current.rot + 1) % rots.size()
	var kicks: Array[int] = [0, -1, 1, -2, 2]
	for k in kicks:
		if valid_position(_current, k, 0, next_rot):
			_current.x += k
			_current.rot = next_rot
			return


func _merge_piece() -> void:
	if _current.is_empty():
		return
	for c: Vector2i in _piece_cells(_current.type, _current.rot):
		var gx: int = _current.x + c.x
		var gy: int = _current.y + c.y
		if gy >= 0:
			_board[gy][gx] = _current.type


func _clear_lines() -> void:
	var cleared: int = 0
	var y: int = ROWS - 1
	while y >= 0:
		var full: bool = true
		for x in COLS:
			if _board[y][x] == null:
				full = false
				break
		if full:
			_board.remove_at(y)
			var new_row: Array = []
			new_row.resize(COLS)
			for i in COLS:
				new_row[i] = null
			_board.insert(0, new_row)
			cleared += 1
		else:
			y -= 1
	if cleared > 0:
		_lines_cleared += cleared
		var tbl: Array[int] = [0, 100, 300, 500, 800]
		var pts: int = tbl[cleared] if cleared < tbl.size() else 800
		_score += pts * _level
		_level = _lines_cleared / 10 + 1


func _drop_interval_sec() -> float:
	return maxf(0.08, 0.8 - float(_level - 1) * 0.065)


func _hard_drop_distance(p: Dictionary) -> int:
	var d: int = 0
	while valid_position(p, 0, d + 1):
		d += 1
	return d


func _ghost_y(p: Dictionary) -> int:
	return p.y + _hard_drop_distance(p)


func _after_lock() -> void:
	_clear_lines()
	_current = _spawn_piece(_next_type)
	_next_type = _pull_bag()
	if not valid_position(_current, 0, 0):
		_game_over = true
	_drop_accum = 0.0


func _reset_game() -> void:
	_empty_board()
	_refill_bag()
	_next_type = _pull_bag()
	_current = _spawn_piece(_pull_bag())
	_score = 0
	_lines_cleared = 0
	_level = 1
	_paused = false
	_game_over = false
	_drop_accum = 0.0
	queue_redraw()


func _process(delta: float) -> void:
	if not _paused and not _game_over and not _current.is_empty():
		_drop_accum += delta
		var interval: float = _drop_interval_sec()
		while _drop_accum >= interval:
			_drop_accum -= interval
			if valid_position(_current, 0, 1):
				_current.y += 1
			else:
				_merge_piece()
				_after_lock()
	queue_redraw()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.echo:
		return

	if event.is_action_pressed("tetris_restart"):
		_reset_game()
		get_viewport().set_input_as_handled()
		return

	if event.is_action_pressed("tetris_pause"):
		if not _game_over:
			_paused = not _paused
			if _paused:
				_drop_accum = 0.0
		get_viewport().set_input_as_handled()
		return

	if _paused or _game_over or _current.is_empty():
		return

	if event.is_action_pressed("tetris_left") and valid_position(_current, -1, 0):
		_current.x -= 1
	elif event.is_action_pressed("tetris_right") and valid_position(_current, 1, 0):
		_current.x += 1
	elif event.is_action_pressed("tetris_soft_drop") and valid_position(_current, 0, 1):
		_current.y += 1
		_score += 1
	elif event.is_action_pressed("tetris_rotate"):
		_try_rotate()
	elif event.is_action_pressed("tetris_hard_drop"):
		var d: int = _hard_drop_distance(_current)
		if d > 0:
			_current.y += d
			_score += d * 2
			_merge_piece()
			_after_lock()
	else:
		return

	get_viewport().set_input_as_handled()


func _draw_cell(origin: Vector2, x: int, y: int, color: Color, alpha: float = 1.0) -> void:
	var p: float = 1.0
	var r := Rect2(origin.x + x * CELL + p, origin.y + y * CELL + p, CELL - p * 2, CELL - p * 2)
	var c := color
	c.a = alpha
	draw_rect(r, c)


func _draw() -> void:
	var o: Vector2 = _board_origin
	var bw: float = COLS * CELL
	var bh: float = ROWS * CELL

	draw_rect(Rect2(o, Vector2(bw, bh)), BOARD_BG)
	for y in ROWS:
		for x in COLS:
			var gr := Rect2(o.x + x * CELL + 0.5, o.y + y * CELL + 0.5, CELL - 1.0, CELL - 1.0)
			draw_rect(gr, GRID_LINE, false, 1.0)

	for y in ROWS:
		for x in COLS:
			var t: Variant = _board[y][x]
			if t != null:
				_draw_cell(o, x, y, COLORS[String(t)])

	if not _current.is_empty() and not _game_over:
		var gy: int = _ghost_y(_current)
		var gdy: int = gy - _current.y
		var ghost_col: Color = COLORS[_current.type]
		for c: Vector2i in _piece_cells(_current.type, _current.rot):
			var py: int = _current.y + c.y + gdy
			if py >= 0:
				_draw_cell(o, _current.x + c.x, py, ghost_col, GHOST_ALPHA)
		for c: Vector2i in _piece_cells(_current.type, _current.rot):
			var py2: int = _current.y + c.y
			if py2 >= 0:
				_draw_cell(o, _current.x + c.x, py2, COLORS[_current.type])

	var hud_x: float = o.x + bw + 36.0
	var fs: int = 18
	var lh: float = 28.0
	var ty: float = o.y
	var accent := Color("#3dff9e")
	var muted := Color("#8b9cb3")
	_draw_hud_label(hud_x, ty, "分数", str(_score), accent, muted, fs)
	_draw_hud_label(hud_x, ty + lh * 2.0, "行数", str(_lines_cleared), accent, muted, fs)
	_draw_hud_label(hud_x, ty + lh * 4.0, "等级", str(_level), accent, muted, fs)

	_draw_hud_label(hud_x, ty + lh * 6.5, "下一个", "", muted, muted, fs - 2)
	_draw_next_preview(Vector2(hud_x, ty + lh * 7.8))

	var hint_y: float = o.y + bh + 28.0
	var hint := "方向键移动 · ↑旋转 · ↓软降 · 空格硬降 · P暂停 · R重开"
	draw_string(_font, Vector2(o.x, hint_y), hint, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, muted)

	if _paused and not _game_over:
		_draw_modal("已暂停 · 按 P 继续")
	if _game_over:
		_draw_modal("游戏结束 · 得分 %d · 按 R 重开" % _score)


func _draw_hud_label(x: float, y: float, title: String, value: String, val_color: Color, title_color: Color, fs: int) -> void:
	draw_string(_font, Vector2(x, y), title, HORIZONTAL_ALIGNMENT_LEFT, -1, fs - 4, title_color)
	if value.length() > 0:
		draw_string(_font, Vector2(x, y + 22.0), value, HORIZONTAL_ALIGNMENT_LEFT, -1, fs + 2, val_color)


func _draw_next_preview(origin: Vector2) -> void:
	if _next_type.is_empty():
		return
	var cells: Array = _piece_cells(_next_type, 0)
	var min_x: int = 999
	var min_y: int = 999
	var max_x: int = -999
	var max_y: int = -999
	for c: Vector2i in cells:
		min_x = mini(min_x, c.x)
		min_y = mini(min_y, c.y)
		max_x = maxi(max_x, c.x)
		max_y = maxi(max_y, c.y)
	var bw: int = max_x - min_x + 1
	var bh: int = max_y - min_y + 1
	var sc: int = mini(24, int(100 / float(maxi(bw, bh))))
	var panel := Rect2(origin.x, origin.y, 120, 100)
	draw_rect(panel, Color(0, 0, 0, 0.25))
	var col: Color = COLORS[_next_type]
	for c: Vector2i in cells:
		var px: float = origin.x + (c.x - min_x) * sc + (panel.size.x - bw * sc) * 0.5
		var py: float = origin.y + (c.y - min_y) * sc + (panel.size.y - bh * sc) * 0.5
		var rr := Rect2(px + 1, py + 1, sc - 2, sc - 2)
		draw_rect(rr, col)


func _draw_modal(msg: String) -> void:
	var vp := get_viewport_rect()
	draw_rect(vp, Color(0.02, 0.03, 0.05, 0.72))
	var font_sz: int = 22
	var sz_i: Vector2i = _font.get_string_size(msg, HORIZONTAL_ALIGNMENT_CENTER, -1, font_sz)
	var sz := Vector2(sz_i)
	var box := Rect2(vp.size * 0.5 - sz * 0.5 - Vector2(24, 20), sz + Vector2(48, 40))
	draw_rect(box, Color(0.106, 0.137, 0.196))
	draw_rect(box, Color(1, 1, 1, 0.1), false, 2.0)
	draw_string(_font, box.position + Vector2(24, box.size.y * 0.5 + font_sz * 0.3), msg, HORIZONTAL_ALIGNMENT_LEFT, -1, font_sz, Color.WHITE)
