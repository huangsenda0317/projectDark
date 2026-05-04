@tool
extends EditorPlugin

## Godot Editor Plugin that starts the MCP WebSocket bridge.
## Exposes editor operations to the Claude Code MCP server via WebSocket on port 6505.

var _ws_server: MCPWebSocketServer = null

func _enter_tree() -> void:
	_ws_server = MCPWebSocketServer.new()
	_ws_server.start()
	add_child(_ws_server)

func _exit_tree() -> void:
	if _ws_server:
		_ws_server.stop()
		_ws_server.queue_free()
		_ws_server = null
