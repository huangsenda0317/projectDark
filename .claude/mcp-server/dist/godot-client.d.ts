export interface RpcRequest {
    id: string;
    method: string;
    params?: Record<string, unknown>;
}
export interface RpcResponse {
    id: string;
    result?: unknown;
    error?: {
        code: number;
        message: string;
    };
}
export type PendingRequest = {
    resolve: (value: RpcResponse) => void;
    reject: (reason: Error) => void;
    timer: ReturnType<typeof setTimeout>;
};
export declare class GodotClient {
    private ws;
    private pending;
    private url;
    private onDisconnect?;
    constructor(url?: string);
    connect(): Promise<void>;
    send(method: string, params?: Record<string, unknown>): Promise<unknown>;
    disconnect(): void;
    setOnDisconnect(cb: () => void): void;
    get connected(): boolean;
}
