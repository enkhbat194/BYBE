// client/src/lib/api.ts

// Shared AI types
export interface AIAdvancedSettings {
  maxTokens?: number;
  temperature?: number;
}

import type { AIProviderName } from "@shared/schema";
import { AIStreamingEngine, type StreamingConfig } from "./aiStreaming";


export const api = {
  // ======================
  // FILE SYSTEM API
  // ======================

  async getFiles(projectId: string): Promise<any> {
    const res = await fetch(`/api/projects/${projectId}/files`);
    if (!res.ok) throw new Error("Failed to load files");
    return res.json();
  },

  async getFile(projectId: string, path: string): Promise<any> {
    const res = await fetch(`/api/projects/${projectId}/files${path}`);
    if (!res.ok) throw new Error("Failed to load file");
    return res.json();
  },

  async updateFile(projectId: string, path: string, content: string): Promise<any> {
    const res = await fetch(`/api/projects/${projectId}/files${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Failed to update file");
    return res.json();
  },

  // ======================
  // AI MESSAGE API
  // ======================

  async sendAIMessage(
    prompt: string,
    provider: AIProviderName,
    apiKey: string,
    model: string,
    advanced: AIAdvancedSettings
  ): Promise<any> {
    if (provider === "openrouter") {
      return await sendOpenRouter(prompt, apiKey, model, advanced);
    }
    if (provider === "openai") {
      return await sendOpenAI(prompt, apiKey, model, advanced);
    }
    if (provider === "anthropic") {
      return await sendAnthropic(prompt, apiKey, model, advanced);
    }
    if (provider === "groq") {
      return await sendOpenAICompatible(prompt, apiKey, model, advanced, "https://api.groq.com/openai/v1");
    }

    throw new Error("Unknown AI provider: " + provider);
  },

  async sendAIStreamMessage(
    prompt: string,
    provider: AIProviderName,
    apiKey: string,
    model: string,
    advanced: AIAdvancedSettings
  ): Promise<ReadableStream | null> {
    const config: StreamingConfig = {
      provider,
      apiKey,
      model,
      prompt,
      advancedSettings: {
        temperature: advanced.temperature,
        maxTokens: advanced.maxTokens,
        streamResponse: true
      }
    };

    const engine = new AIStreamingEngine(config);
    
    // Convert async generator to ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of engine.stream()) {
            controller.enqueue(chunk);
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
      cancel() {
        engine.stop();
      }
    });

    return stream;
  },
};

// ======================================================
// OPENROUTER — CHAT
// ======================================================

async function sendOpenRouter(
  prompt: string,
  apiKey: string,
  model: string,
  advanced: AIAdvancedSettings
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: advanced?.maxTokens ?? 2048,
      temperature: advanced?.temperature ?? 0.2,
      stream: false,
    }),
  });

  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "(no response)";
}

// ======================================================
// OPENROUTER — STREAM
// ======================================================

async function streamOpenRouter(
  prompt: string,
  apiKey: string,
  model: string,
  advanced: AIAdvancedSettings
): Promise<ReadableStream> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: true,
      temperature: advanced?.temperature ?? 0.2,
    }),
  });

  if (!res.ok) throw new Error("OpenRouter stream failed");
  return res.body!;
}

// ======================================================
// OPENAI COMPATIBLE (Groq, Mistral, etc)
// ======================================================

async function sendOpenAICompatible(
  prompt: string,
  apiKey: string,
  model: string,
  advanced: AIAdvancedSettings,
  baseUrl: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: advanced?.maxTokens ?? 2048,
      temperature: advanced?.temperature ?? 0.2,
    }),
  });

  const json = await res.json();
  return json?.choices?.[0]?.message?.content ?? "(no response)";
}

async function streamOpenAICompatible(
  prompt: string,
  apiKey: string,
  model: string,
  advanced: AIAdvancedSettings,
  baseUrl: string
): Promise<ReadableStream> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: true,
      temperature: advanced?.temperature ?? 0.2,
    }),
  });

  return res.body!;
}

// ======================================================
// OPENAI DIRECT
// ======================================================

async function sendOpenAI(prompt: string, apiKey: string, model: string, advanced: AIAdvancedSettings) {
  return sendOpenAICompatible(prompt, apiKey, model, advanced, "https://api.openai.com/v1");
}

async function streamOpenAI(prompt: string, apiKey: string, model: string, advanced: AIAdvancedSettings) {
  return streamOpenAICompatible(prompt, apiKey, model, advanced, "https://api.openai.com/v1");
}

// ======================================================
// ANTHROPIC
// ======================================================

async function sendAnthropic(
  prompt: string,
  apiKey: string,
  model: string,
  advanced: AIAdvancedSettings
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      accept: "application/json",
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: advanced?.maxTokens ?? 2048,
      messages: [{ role: "user", content: prompt }],
      temperature: advanced?.temperature ?? 0.2,
    }),
  });

  const data = await res.json();
  return data?.content?.[0]?.text ?? "(no response)";
}

async function streamAnthropic(
  prompt: string,
  apiKey: string,
  model: string,
  advanced: AIAdvancedSettings
): Promise<ReadableStream> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      accept: "application/json",
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: advanced?.maxTokens ?? 2048,
      messages: [{ role: "user", content: prompt }],
      temperature: advanced?.temperature ?? 0.2,
      stream: true,
    }),
  });

  return res.body!;
}
