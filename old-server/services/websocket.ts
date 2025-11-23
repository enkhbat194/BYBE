import { Server as SocketIOServer, Socket } from "socket.io";
import { spawn } from "child_process";

// Store connected clients
const clients = new Set<Socket>();
const terminalProcesses = new Map<string, any>();

export class WebSocketService {
  private io: SocketIOServer;

  constructor(httpServer: any) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: Socket) => {
      console.log("Client connected:", socket.id);
      clients.add(socket);
  
      // Terminal shell setup
      const shell = spawn("cmd.exe", [], {
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
        windowsHide: true
      });
  
      terminalProcesses.set(socket.id, shell);
  
      shell.stdout.on("data", (data: Buffer) => {
        socket.emit("terminal_output", {
          output: data.toString(),
          type: "stdout"
        });
      });
  
      shell.stderr.on("data", (data: Buffer) => {
        socket.emit("terminal_output", {
          output: data.toString(),
          type: "stderr"
        });
      });
  
      shell.on("close", (code: number) => {
        socket.emit("terminal_output", {
          output: `\r\n[Terminal] Process exited with code ${code}\r\n`,
          type: "exit"
        });
        terminalProcesses.delete(socket.id);
      });
  
      shell.on("error", (err: Error) => {
        socket.emit("terminal_output", {
          output: `[Terminal] Spawn error: ${err.message}\r\n`,
          type: "error"
        });
      });
  
      // Join general room
      socket.join("general");
  
      socket.on("terminal_input", (data: { input: string }) => {
        const proc = terminalProcesses.get(socket.id);
        if (proc?.stdin) {
          proc.stdin.write(data.input + "\r\n");
        }
      });
  
      socket.on("terminal_clear", () => {
        const proc = terminalProcesses.get(socket.id);
        if (proc?.stdin) {
          proc.stdin.write("cls\r\n");
        }
      });
  
      socket.on("terminal_kill", () => {
        const proc = terminalProcesses.get(socket.id);
        if (proc) {
          proc.kill();
          terminalProcesses.delete(socket.id);
        }
      });
  
      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        const proc = terminalProcesses.get(socket.id);
        if (proc) {
          proc.kill();
          terminalProcesses.delete(socket.id);
        }
        clients.delete(socket);
      });

      // ----------------------------
      // MODEL/PROVIDER RELATED EVENTS
      // ----------------------------
      socket.on("subscribe_provider_updates", (providerId: string) => {
        socket.join(`provider_${providerId}`);
        console.log(`Client ${socket.id} subscribed to provider ${providerId}`);
      });

      socket.on("unsubscribe_provider_updates", (providerId: string) => {
        socket.leave(`provider_${providerId}`);
        console.log(`Client ${socket.id} unsubscribed from provider ${providerId}`);
      });

      socket.on("subscribe_models", () => {
        socket.join("models");
        console.log(`Client ${socket.id} subscribed to models updates`);
      });

      socket.on("unsubscribe_models", () => {
        socket.leave("models");
        console.log(`Client ${socket.id} unsubscribed from models updates`);
      });

    });
  }

  // Broadcast event to all clients
  broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  // Broadcast event to specific room
  broadcastToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }

  // Send event to one client
  sendToClient(clientId: string, event: string, data: any) {
    this.io.to(clientId).emit(event, data);
  }

  // Provider status
  broadcastProviderStatus(providerId: string, status: string, details?: any) {
    this.broadcastToRoom(`provider_${providerId}`, "provider_status", {
      providerId,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Models update
  broadcastModelsUpdate(providerId: string, models: any[], count?: number) {
    const payload = {
      providerId,
      models,
      count: count || models.length,
      timestamp: new Date().toISOString(),
    };

    this.broadcastToRoom("models", "models_updated", payload);
    this.broadcastToRoom(`provider_${providerId}`, "models_updated", payload);
  }

  broadcastSyncStarted(providerId: string) {
    this.broadcastToRoom(`provider_${providerId}`, "sync_started", {
      providerId,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastSyncCompleted(providerId: string, success: boolean, count?: number, error?: string) {
    this.broadcastToRoom(`provider_${providerId}`, "sync_completed", {
      providerId,
      success,
      count,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  getStats() {
    return {
      totalClients: clients.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
    };
  }

  disconnect() {
    this.io.disconnectSockets();
    clients.clear();
  }
}

// Global instance
let webSocketService: WebSocketService | null = null;

export function initializeWebSocket(httpServer: any): WebSocketService {
  if (!webSocketService) {
    webSocketService = new WebSocketService(httpServer);
  }
  return webSocketService;
}

export function getWebSocketService(): WebSocketService | null {
  return webSocketService;
}
