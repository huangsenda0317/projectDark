@tool
class_name MCPWebSocketServer
extends Node

## WebSocket server that listens for JSON-RPC commands from Claude Code MCP bridge.
## Runs inside the Godot editor via MCPBridgePlugin.

const PORT: int = 6505
const BIND_ADDR: String = "127.0.0.1"

var _tcp_server: TCPServer = null
var _ws_peer: WebSocketPeer = null
var _stream: StreamPeerTCP = null
var _pending_requests: Dictionary = {}
var _running: bool = false

func start(port: int = PORT) -> void:
	_tcp_server = TCPServer.new()
	var err = _tcp_server.listen(port, BIND_ADDR)
	if err != OK:
		push_error("[MCP Bridge] Failed to listen on port %d: %d" % [port, err])
		return
	_running = true
	print("[MCP Bridge] WebSocket server listening on ws://%s:%d" % [BIND_ADDR, port])

func stop() -> void:
	_running = false
	if _ws_peer:
		_ws_peer.close()
		_ws_peer = null
	if _stream:
		_stream = null
	if _tcp_server:
		_tcp_server.stop()
		_tcp_server = null
	print("[MCP Bridge] WebSocket server stopped")

func _process(_delta: float) -> void:
	if not _running:
		return

	# Accept new TCP connection
	if _tcp_server and _tcp_server.is_connection_available():
		if _ws_peer:
			# Already have a connection; reject new one (single-client model)
			var old_conn = _tcp_server.take_connection()
			old_conn.disconnect_from_host()
			print("[MCP Bridge] Rejected new connection: already connected")
		else:
			_stream = _tcp_server.take_connection()
			_ws_peer = WebSocketPeer.new()
			_ws_peer.accept_stream(_stream)
			print("[MCP Bridge] Client connecting...")

	# Poll existing WebSocket connection
	if _ws_peer:
		_ws_peer.poll()
		var state = _ws_peer.get_ready_state()

		match state:
			WebSocketPeer.STATE_OPEN:
				_read_messages()
			WebSocketPeer.STATE_CLOSED:
				_cleanup_connection()
			WebSocketPeer.STATE_CLOSING:
				pass  # Wait for close to complete

func _read_messages() -> void:
	while _ws_peer.get_available_packet_count() > 0:
		var packet: PackedByteArray = _ws_peer.get_packet()
		var msg_text: String = packet.get_string_from_utf8()
		var json = JSON.new()
		var err = json.parse(msg_text)
		if err != OK:
			_send_error("", -32700, "Parse error: %s" % json.get_error_message())
			continue

		var data = json.get_data()
		if not data is Dictionary:
			_send_error("", -32600, "Invalid Request: expected JSON object")
			continue

		var request_id = data.get("id", "")
		var method: String = data.get("method", "")
		var params: Dictionary = data.get("params", {})

		if method.is_empty():
			_send_error(request_id, -32600, "Invalid Request: missing method")
			continue

		_handle_request(request_id, method, params)

func _handle_request(request_id: String, method: String, params: Dictionary) -> void:
	match method:
		"read_file":
			_cmd_read_file(request_id, params)
		"write_file":
			_cmd_write_file(request_id, params)
		"list_files":
			_cmd_list_files(request_id, params)
		"run_scene":
			_cmd_run_scene(request_id)
		"stop_scene":
			_cmd_stop_scene(request_id)
		"get_state":
			_cmd_get_state(request_id)
		"simulate_key":
			_cmd_simulate_key(request_id, params)
		"simulate_click":
			_cmd_simulate_click(request_id, params)
		_:
			_send_error(request_id, -32601, "Method not found: %s" % method)

# ── Input simulation ────────────────────────────────────────────────────

const KEY_MAP := {
	"enter": KEY_ENTER,
	"tab": KEY_TAB,
	"space": KEY_SPACE,
	"escape": KEY_ESCAPE,
	"backspace": KEY_BACKSPACE,
	"delete": KEY_DELETE,
	"up": KEY_UP,
	"down": KEY_DOWN,
	"left": KEY_LEFT,
	"right": KEY_RIGHT,
	"home": KEY_HOME,
	"end": KEY_END,
	"a": KEY_A, "b": KEY_B, "c": KEY_C, "d": KEY_D, "e": KEY_E,
	"f": KEY_F, "g": KEY_G, "h": KEY_H, "i": KEY_I, "j": KEY_J,
	"k": KEY_K, "l": KEY_L, "m": KEY_M, "n": KEY_N, "o": KEY_O,
	"p": KEY_P, "q": KEY_Q, "r": KEY_R, "s": KEY_S, "t": KEY_T,
	"u": KEY_U, "v": KEY_V, "w": KEY_W, "x": KEY_X, "y": KEY_Y,
	"z": KEY_Z,
	"0": KEY_0, "1": KEY_1, "2": KEY_2, "3": KEY_3, "4": KEY_4,
	"5": KEY_5, "6": KEY_6, "7": KEY_7, "8": KEY_8, "9": KEY_9,
	"-": KEY_MINUS, "=": KEY_EQUAL,
}

func _get_game_viewport():
	var ml = Engine.get_main_loop()
	if ml and ml is SceneTree:
		return ml.root
	return null

func _push_event(ev: InputEvent) -> void:
	var vp = _get_game_viewport()
	if vp:
		vp.push_input(ev)
	else:
		Input.parse_input_event(ev)

func _cmd_simulate_key(request_id: String, params: Dictionary) -> void:
	var key_name: String = params.get("key", "")
	var mod_shift: bool = params.get("shift", false)
	var mod_ctrl: bool = params.get("ctrl", false)

	var keycode = KEY_MAP.get(key_name.to_lower(), -1)
	if keycode == -1:
		_send_error(request_id, -32602, "Unknown key: %s" % key_name)
		return

	var ev = InputEventKey.new()
	ev.keycode = keycode
	ev.pressed = true
	ev.shift_pressed = mod_shift
	ev.ctrl_pressed = mod_ctrl
	_push_event(ev)

	# Auto-release
	var ev_up = InputEventKey.new()
	ev_up.keycode = keycode
	ev_up.pressed = false
	ev_up.shift_pressed = mod_shift
	ev_up.ctrl_pressed = mod_ctrl
	_push_event(ev_up)

	_send_result(request_id, {"key": key_name, "pressed": true})

func _cmd_simulate_click(request_id: String, params: Dictionary) -> void:
	var x: float = params.get("x", 0.0)
	var y: float = params.get("y", 0.0)
	var button_index: int = params.get("button", 1)

	var ev = InputEventMouseButton.new()
	ev.button_index = button_index
	ev.position = Vector2(x, y)
	ev.pressed = true
	_push_event(ev)

	# Auto-release
	var ev_up = InputEventMouseButton.new()
	ev_up.button_index = button_index
	ev_up.position = Vector2(x, y)
	ev_up.pressed = false
	_push_event(ev_up)

	_send_result(request_id, {"x": x, "y": y, "clicked": true})

# ── Command implementations ─────────────────────────────────────────────

func _cmd_read_file(request_id: String, params: Dictionary) -> void:
	var path: String = params.get("path", "")
	if path.is_empty():
		_send_error(request_id, -32602, "Missing param: path")
		return

	var full_path = _resolve_path(path)
	if not FileAccess.file_exists(full_path):
		_send_error(request_id, -32000, "File not found: %s" % path)
		return

	var file = FileAccess.open(full_path, FileAccess.READ)
	if not file:
		_send_error(request_id, -32000, "Cannot open file: %s" % path)
		return

	var content = file.get_as_text()
	_send_result(request_id, {"path": path, "content": content})

func _cmd_write_file(request_id: String, params: Dictionary) -> void:
	var path: String = params.get("path", "")
	var content: String = params.get("content", "")
	if path.is_empty():
		_send_error(request_id, -32602, "Missing param: path")
		return

	var full_path = _resolve_path(path)
	var file = FileAccess.open(full_path, FileAccess.WRITE)
	if not file:
		_send_error(request_id, -32000, "Cannot write file: %s" % path)
		return

	file.store_string(content)
	file.close()
	EditorInterface.get_resource_filesystem().scan()
	_send_result(request_id, {"path": path, "written": true})

func _cmd_list_files(request_id: String, params: Dictionary) -> void:
	var dir_path: String = params.get("dir_path", "res://")
	var full_path = _resolve_path(dir_path)

	var dir = DirAccess.open(full_path)
	if not dir:
		_send_error(request_id, -32000, "Cannot open directory: %s" % dir_path)
		return

	var files: Array = []
	dir.list_dir_begin()
	var file_name = dir.get_next()
	while not file_name.is_empty():
		if not file_name.begins_with("."):
			var is_dir = dir.current_is_dir()
			files.append({
				"name": file_name,
				"type": "directory" if is_dir else "file"
			})
		file_name = dir.get_next()
	dir.list_dir_end()

	_send_result(request_id, {"dir_path": dir_path, "files": files})

func _cmd_run_scene(request_id: String) -> void:
	if EditorInterface.is_playing_scene():
		_send_error(request_id, -32000, "Scene is already running")
		return

	EditorInterface.play_main_scene()
	_send_result(request_id, {"running": true})

func _cmd_stop_scene(request_id: String) -> void:
	if not EditorInterface.is_playing_scene():
		_send_error(request_id, -32000, "No scene is running")
		return

	EditorInterface.stop_playing_scene()
	_send_result(request_id, {"running": false})

func _cmd_get_state(request_id: String) -> void:
	var edited_scene = EditorInterface.get_edited_scene_root()
	var scene_path = ""
	if edited_scene:
		scene_path = edited_scene.scene_file_path

	var selected_nodes: Array = []
	var selection = EditorInterface.get_selection()
	if selection:
		for node in selection.get_selected_nodes():
			selected_nodes.append({
				"name": node.name,
				"type": node.get_class(),
				"path": str(node.get_path())
			})

	_send_result(request_id, {
		"scene": scene_path,
		"is_playing": EditorInterface.is_playing_scene(),
		"selected_nodes": selected_nodes
	})

# ── Response helpers ────────────────────────────────────────────────────

func _send_result(request_id: String, result) -> void:
	_send_json({
		"id": request_id,
		"result": result
	})

func _send_error(request_id: String, code: int, message: String) -> void:
	_send_json({
		"id": request_id,
		"error": {
			"code": code,
			"message": message
		}
	})

func _send_json(data: Dictionary) -> void:
	if not _ws_peer or _ws_peer.get_ready_state() != WebSocketPeer.STATE_OPEN:
		return
	var json_str = JSON.stringify(data)
	_ws_peer.send(json_str.to_utf8_buffer())

func _cleanup_connection() -> void:
	print("[MCP Bridge] Client disconnected")
	_ws_peer = null
	_stream = null

## Resolves a resource path (res://) or relative path to a filesystem path.
func _resolve_path(path: String) -> String:
	if path.begins_with("res://"):
		return ProjectSettings.globalize_path(path)
	return path
