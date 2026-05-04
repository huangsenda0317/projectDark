import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
const TIMEOUT_MS = 30_000;
const RECONNECT_DELAY_MS = 2000;
export class GodotClient {
    ws = null;
    pending = new Map();
    url;
    onDisconnect;
    constructor(url = "ws://127.0.0.1:6505") {
        this.url = url;
    }
    connect() {
        return new Promise((resolve, reject) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                resolve();
                return;
            }
            this.ws = new WebSocket(this.url);
            this.ws.on("open", () => {
                console.error("[MCP Bridge] Connected to Godot on", this.url);
                resolve();
            });
            this.ws.on("message", (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    const pending = this.pending.get(response.id);
                    if (pending) {
                        clearTimeout(pending.timer);
                        this.pending.delete(response.id);
                        if (response.error) {
                            pending.reject(new Error(response.error.message));
                        }
                        else {
                            pending.resolve(response);
                        }
                    }
                }
                catch (e) {
                    // Ignore parse errors on stray messages
                }
            });
            this.ws.on("close", () => {
                console.error("[MCP Bridge] Godot connection closed");
                this.ws = null;
                // Reject all pending
                for (const [id, pending] of this.pending) {
                    clearTimeout(pending.timer);
                    pending.reject(new Error("Connection closed"));
                    this.pending.delete(id);
                }
                if (this.onDisconnect)
                    this.onDisconnect();
            });
            this.ws.on("error", (err) => {
                console.error("[MCP Bridge] WebSocket error:", err.message);
                // The 'close' event will fire next; let it handle cleanup
            });
            // Timeout for initial connection
            const connectTimer = setTimeout(() => {
                if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
                    this.ws.close();
                    reject(new Error("Connection timeout"));
                }
            }, TIMEOUT_MS);
            this.ws.once("open", () => clearTimeout(connectTimer));
        });
    }
    async send(method, params = {}) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            await this.connect();
        }
        const id = uuidv4();
        const request = { id, method, params };
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`Request timeout: ${method}`));
            }, TIMEOUT_MS);
            this.pending.set(id, { resolve, reject, timer });
            this.ws.send(JSON.stringify(request));
        });
    }
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    setOnDisconnect(cb) {
        this.onDisconnect = cb;
    }
    get connected() {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}
//# sourceMappingURL=godot-client.js.map