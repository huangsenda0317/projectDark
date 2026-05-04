#!/usr/bin/env node
// Direct WebSocket JSON-RPC client for Godot MCP Bridge.
// Usage: node ws_send.mjs <method> [json_params]

import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { resolve } from "path";

const URL = "ws://127.0.0.1:6505";
const TIMEOUT = 15000;

const method = process.argv[2];
let params = {};

if (process.argv[3]) {
  try {
    params = JSON.parse(process.argv[3]);
  } catch {
    // Treat as single string value for "key" param
    params = { key: process.argv[3] };
  }
}

const ws = new WebSocket(URL);
const id = uuidv4();

const timer = setTimeout(() => {
  console.error("TIMEOUT");
  process.exit(1);
}, TIMEOUT);

ws.on("open", () => {
  ws.send(JSON.stringify({ id, method, params }));
});

ws.on("message", (data) => {
  clearTimeout(timer);
  const response = JSON.parse(data.toString());
  console.log(JSON.stringify(response, null, 2));
  ws.close();
});

ws.on("error", (err) => {
  clearTimeout(timer);
  console.error("WebSocket error:", err.message);
  process.exit(1);
});

ws.on("close", () => {
  process.exit(0);
});
