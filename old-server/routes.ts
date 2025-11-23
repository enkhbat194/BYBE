import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { exec } from "child_process";
import { promisify } from "util";
import providerRoutes from './routes/providers';
import secretsRoutes from './routes/secrets';
import { initializeWebSocket } from './services/websocket';
import { ADAPTERS } from './providers/registry';

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
    let provider: string = 'unknown';
    try {
      const { message, apiKey, model, advancedSettings } = req.body;
      provider = req.body.provider;
      
      if (!provider) {
        return res.status(400).json({
          error: "Provider not specified."
        });
      }

      if (!apiKey) {
        return res.status(400).json({
          error: "API key not provided. Please configure your API key in Settings."
        });
      }

      const adapter = ADAPTERS[provider];
      if (!adapter) {
        return res.status(400).json({
          error: `Provider '${provider}' not supported.`
        });
      }

      if (!adapter.chat) {
        return res.status(400).json({
          error: `Provider '${provider}' does not support chat.`
        });
      }

      // Use default model if none specified
      const modelId = model || (adapter.defaultModel || 'gpt-3.5-turbo');

      // Prepare messages with system prompt if provided
      const messages = [];
      
      // Add system prompt if provided in advanced settings
      if (advancedSettings?.systemPrompt) {
        messages.push({ role: 'system', content: advancedSettings.systemPrompt });
      }
      
      messages.push({ role: 'user', content: message });

      const chatParams: any = {
        apiKey,
        model: modelId,
        messages
      };

      // Add advanced settings if provided
      if (advancedSettings) {
        if (advancedSettings.temperature !== undefined) {
          chatParams.temperature = advancedSettings.temperature;
        }
        if (advancedSettings.maxTokens !== undefined) {
          chatParams.maxTokens = advancedSettings.maxTokens;
        }
        if (advancedSettings.topP !== undefined) {
          chatParams.topP = advancedSettings.topP;
        }
        if (advancedSettings.frequencyPenalty !== undefined) {
          chatParams.frequencyPenalty = advancedSettings.frequencyPenalty;
        }
        if (advancedSettings.presencePenalty !== undefined) {
          chatParams.presencePenalty = advancedSettings.presencePenalty;
        }
        if (advancedSettings.streamResponse !== undefined) {
          chatParams.stream = advancedSettings.streamResponse;
        }
      }

      const chatResponse = await adapter.chat(chatParams);

      res.json({
        response: chatResponse.content,
        model: chatResponse.model || modelId,
        usage: chatResponse.usage
      });
    } catch (error: any) {
      console.error('AI Chat Error:', error);
      res.status(500).json({
        error: error.message || "Failed to get AI response",
        provider
      });
    }
  });

  // Mount provider routes
  app.use('/api/providers', providerRoutes);
  
  // Mount secrets routes
  app.use('/api/secrets', secretsRoutes);

  // Create HTTP server and initialize WebSocket service
  const httpServer = createServer(app);
  const webSocketService = initializeWebSocket(httpServer);

  return httpServer;
}
