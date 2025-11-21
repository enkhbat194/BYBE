import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to get project" });
    }
  });

  app.get("/api/projects/:id/files", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project.files);
    } catch (error) {
      res.status(500).json({ error: "Failed to get files" });
    }
  });

  app.get("/api/projects/:id/files/*", async (req, res) => {
    try {
      const pathParam = (req.params as any)[0];
      const path = '/' + pathParam;
      const file = await storage.getFile(req.params.id, path);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to get file" });
    }
  });

  app.post("/api/projects/:id/files", async (req, res) => {
    try {
      const { name, type, path, content, parentPath } = req.body;
      
      if (!name || !type || !path) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newFile = {
        id: Date.now().toString(),
        name,
        type,
        path,
        content: type === 'file' ? (content || '') : undefined,
        children: type === 'folder' ? [] : undefined,
      };

      const createdFile = await storage.createFile(req.params.id, newFile, parentPath);
      res.json(createdFile);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create file" });
    }
  });

  app.put("/api/projects/:id/files/*", async (req, res) => {
    try {
      const pathParam = (req.params as any)[0];
      const path = '/' + pathParam;
      const { content } = req.body;
      
      const updatedFile = await storage.updateFile(req.params.id, path, content);
      res.json(updatedFile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update file" });
    }
  });

  app.delete("/api/projects/:id/files/*", async (req, res) => {
    try {
      const pathParam = (req.params as any)[0];
      const path = '/' + pathParam;
      await storage.deleteFile(req.params.id, path);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, provider } = req.body;
      
      const apiKey = provider === 'openai' 
        ? process.env.OPENAI_API_KEY 
        : process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        return res.status(400).json({ 
          error: `${provider.toUpperCase()} API key not configured. Please set it in Settings.` 
        });
      }

      let response = `AI response to: "${message}"\n\nThis is a demo response. To enable real AI, configure your API keys.`;
      
      res.json({ response });
    } catch (error) {
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Terminal client connected");

    socket.on("command", async (data: { command: string }) => {
      const { command } = data;
      
      try {
        if (command === 'clear') {
          socket.emit("output", { output: '', type: 'clear' });
          return;
        }

        socket.emit("output", { output: `$ ${command}\n`, type: 'command' });

        const allowedCommands: Record<string, string[]> = {
          'ls': ['ls', 'ls -la', 'ls -l', 'ls -a'],
          'pwd': ['pwd'],
          'echo': [],
          'date': ['date'],
          'whoami': ['whoami'],
          'node': ['node --version', 'node -v'],
          'npm': ['npm --version', 'npm -v'],
        };

        const commandParts = command.trim().split(' ');
        const baseCommand = commandParts[0];

        if (baseCommand === 'echo' && commandParts.length > 1) {
          const message = commandParts.slice(1).join(' ');
          socket.emit("output", { output: message + '\n', type: 'stdout' });
          return;
        }

        const allowedVariants = allowedCommands[baseCommand];
        if (allowedVariants && (allowedVariants.length === 0 || allowedVariants.includes(command))) {
          const { stdout, stderr } = await execAsync(command, { 
            timeout: 5000,
            cwd: process.cwd(),
            shell: '/bin/sh'
          });
          
          if (stdout) {
            socket.emit("output", { output: stdout, type: 'stdout' });
          }
          if (stderr) {
            socket.emit("output", { output: stderr, type: 'stderr' });
          }
        } else {
          socket.emit("output", { 
            output: `Command "${command}" is not allowed.\nAllowed: ls, ls -la, pwd, echo <text>, date, whoami, node --version, npm --version\n`, 
            type: 'error' 
          });
        }
      } catch (error: any) {
        socket.emit("output", { 
          output: `Error: ${error.message}\n`, 
          type: 'error' 
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Terminal client disconnected");
    });
  });

  return httpServer;
}
