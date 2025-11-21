import { Server as SocketIOServer, Socket } from "socket.io";
import { exec } from "child_process";

// Store connected clients
const clients = new Set<Socket>();

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

      // Join general room
      socket.join("general");

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
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

      // ----------------------------
      // TERMINAL COMMAND HANDLING
      // ----------------------------
      socket.on("terminal_command", (data: { command: string }) => {
        const { command } = data;
        console.log("Terminal command:", command);

        if (command === "clear") {
          socket.emit("terminal_output", {
            output: "",
            type: "clear",
          });
          return;
        }

        try {
          exec(command, (err, stdout, stderr) => {
            if (stdout) {
              socket.emit("terminal_output", {
                output: stdout,
                type: "text",
              });
            }

            if (stderr) {
              socket.emit("terminal_output", {
                output: stderr,
                type: "error",
              });
            }

            if (err) {
              socket.emit("terminal_output", {
                output: err.message,
                type: "error",
              });
            }
          });
        } catch (error: any) {
          socket.emit("terminal_output", {
            output: error.message,
            type: "error",
          });
        }
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
