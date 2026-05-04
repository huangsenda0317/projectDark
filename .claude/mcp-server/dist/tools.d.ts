import { z } from "zod";
import { GodotClient } from "./godot-client.js";
export interface ToolEntry {
    name: string;
    description: string;
    inputSchema: z.ZodRawShape;
    handler: (client: GodotClient, args: Record<string, unknown>) => Promise<string>;
}
export declare const TOOLS: ToolEntry[];
