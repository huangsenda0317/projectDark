#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GodotClient } from "./godot-client.js";
import { TOOLS } from "./tools.js";

const GODOT_WS_URL = process.env.GODOT_MCP_URL || "ws://127.0.0.1:6505";

const godot = new GodotClient(GODOT_WS_URL);

async function ensureConnected(): Promise<void> {
  if (!godot.connected) {
    console.error("[MCP Bridge] Connecting to Godot...");
    await godot.connect();
  }
}

const server = new McpServer({
  name: "godot-mcp-bridge",
  version: "0.1.0",
});

// Register all tools using Zod schemas
for (const tool of TOOLS) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.inputSchema,
    },
    async (args: Record<string, unknown>) => {
      try {
        await ensureConnected();
        const result = await tool.handler(godot, args);
        return {
          content: [{ type: "text", text: result }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}

// Cleanup on exit
process.on("SIGINT", () => {
  godot.disconnect();
  process.exit(0);
});

process.on("SIGTERM", () => {
  godot.disconnect();
  process.exit(0);
});

// Start MCP server over stdio
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[MCP Bridge] MCP server ready (Godot:", GODOT_WS_URL, ")");
