import { z } from "zod";
export const TOOLS = [
    {
        name: "godot_read_file",
        description: "Read the contents of a file in the Godot project. Accepts res:// paths or absolute paths.",
        inputSchema: {
            path: z.string().describe("File path (e.g., res://scenes/main_menu.tscn)"),
        },
        handler: async (client, args) => {
            const result = await client.send("read_file", args);
            return JSON.stringify(result, null, 2);
        },
    },
    {
        name: "godot_write_file",
        description: "Write content to a file in the Godot project. Triggers a filesystem scan.",
        inputSchema: {
            path: z.string().describe("File path to write to"),
            content: z.string().describe("File content to write"),
        },
        handler: async (client, args) => {
            const result = await client.send("write_file", args);
            return JSON.stringify(result, null, 2);
        },
    },
    {
        name: "godot_list_files",
        description: "List files and directories at the given path in the Godot project.",
        inputSchema: {
            dir_path: z.string().describe("Directory path (e.g., res://scripts/)"),
        },
        handler: async (client, args) => {
            const result = await client.send("list_files", args);
            return JSON.stringify(result, null, 2);
        },
    },
    {
        name: "godot_run_scene",
        description: "Start playing the main scene in the Godot editor.",
        inputSchema: {},
        handler: async (client) => {
            const result = await client.send("run_scene", {});
            return JSON.stringify(result, null, 2);
        },
    },
    {
        name: "godot_stop_scene",
        description: "Stop playing the current scene in the Godot editor.",
        inputSchema: {},
        handler: async (client) => {
            const result = await client.send("stop_scene", {});
            return JSON.stringify(result, null, 2);
        },
    },
    {
        name: "godot_get_state",
        description: "Get the current Godot editor state: open scene, selected nodes, play status.",
        inputSchema: {},
        handler: async (client) => {
            const result = await client.send("get_state", {});
            return JSON.stringify(result, null, 2);
        },
    },
    {
        name: "godot_simulate_key",
        description: "Simulate a keyboard key press in the running Godot game. Key name examples: enter, tab, space, escape, a-z, 0-9, up, down, left, right.",
        inputSchema: {
            key: z.string().describe("Key name (e.g., enter, tab, a, 1, up)"),
            shift: z.boolean().optional().describe("Hold shift modifier"),
            ctrl: z.boolean().optional().describe("Hold ctrl modifier"),
        },
        handler: async (client, args) => {
            const result = await client.send("simulate_key", args);
            return JSON.stringify(result, null, 2);
        },
    },
    {
        name: "godot_simulate_click",
        description: "Simulate a mouse click at the given coordinates in the running Godot game. Coordinates are in game viewport space (960x540 default).",
        inputSchema: {
            x: z.number().describe("X coordinate in game viewport"),
            y: z.number().describe("Y coordinate in game viewport"),
            button: z.number().optional().describe("Mouse button: 1=left, 2=right (default 1)"),
        },
        handler: async (client, args) => {
            const result = await client.send("simulate_click", args);
            return JSON.stringify(result, null, 2);
        },
    },
];
//# sourceMappingURL=tools.js.map