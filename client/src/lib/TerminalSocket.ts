// client/src/lib/TerminalSocket.ts
import { io, Socket } from "socket.io-client";

export interface TerminalOutput {
  output: string;
  type: "text" | "error" | "clear";
}

export default class TerminalSocket {
  private socket: Socket;

  constructor() {
    this.socket = io("/", {
      path: "/socket.io",
      transports: ["websocket"],
    });
  }

  connect() {
    this.socket.on("connect", () => {
      console.log("Terminal connected:", this.socket.id);
    });
    return this;
  }

  onOutput(callback: (output: string, type: string) => void) {
    this.socket.on("terminal_output", (data: TerminalOutput) => {
      callback(data.output, data.type);
    });
    return this;
  }

  sendCommand(command: string) {
    this.socket.emit("terminal_command", { command });
  }

  disconnect() {
    this.socket.disconnect();
  }
}
