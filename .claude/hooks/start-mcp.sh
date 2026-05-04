#!/bin/bash
# Start the Godot MCP Bridge server
# Called by Claude Code as an MCP stdio server
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
MCP_DIR="$PROJECT_DIR/.claude/mcp-server"

cd "$MCP_DIR" || exit 1
exec node --import tsx/esm src/index.ts
