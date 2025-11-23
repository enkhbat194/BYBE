// client/src/lib/TerminalSocket.ts
import { io, Socket } from "socket.io-client";

export interface TerminalOutput {
  output: string;
  type: "text" | "error" | "clear";
}

export default class TerminalSocket {
  private socket: Socket | null = null;

  constructor() {
    // Socket.IO client will auto-connect to same origin
    this.socket = io({
      path: "/socket.io",
      transports: ["websocket"],
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket!.on("connect", () => {
        console.log("Terminal connected:", this.socket!.id);
        resolve();
      });

      this.socket!.on("connect_error", (err) => {
        console.error("Terminal connect error:", err);
        reject(err);
      });

      this.socket!.connect();
    });
  }

  onOutput(callback: (output: string, type: "stdout" | "stderr" | "exit" | "error") => void) {
    if (this.socket) {
      this.socket.on("terminal_output", (data: { output: string; type: "stdout" | "stderr" | "exit" | "error" }) => {
        callback(data.output, data.type);
      });
    }
    return this;
  }

  sendInput(input: string) {
    if (this.socket?.connected) {
      this.socket.emit("terminal_input", { input });
    }
  }

  clear() {
    if (this.socket?.connected) {
      this.socket.emit("terminal_clear");
    }
  }

  kill() {
    if (this.socket?.connected) {
      this.socket.emit("terminal_kill");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}
