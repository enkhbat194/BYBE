// Unified AI Streaming Engine
// Handles all provider streaming formats and normalizes to unified format

export interface UnifiedChunk {
  type: "content" | "error" | "done";
  text?: string;
  error?: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface StreamingConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  prompt: string;
  advancedSettings: {
    temperature?: number;
    maxTokens?: number;
    streamResponse?: boolean;
  };
}

// Chunk parsers for different providers
export class StreamParser {
  static parseOpenAICompatible(chunk: string): UnifiedChunk[] {
    const results: UnifiedChunk[] = [];
    
    try {
      // Handle SSE format: data: {"choices": [...]}
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) continue;
        
        const trimmed = line.replace(/^data:\s*/, '');
        if (trimmed === '[DONE]') {
          results.push({ type: "done" });
          continue;
        }
        
        try {
          const data = JSON.parse(trimmed);
          
          if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            
            if (choice.delta && choice.delta.content) {
              results.push({
                type: "content",
                text: choice.delta.content
              });
            }
            
            if (choice.finish_reason) {
              results.push({
                type: "done",
                finishReason: choice.finish_reason
              });
            }
            
            if (data.usage) {
              results.push({
                type: "content",
                usage: {
                  promptTokens: data.usage.prompt_tokens,
                  completionTokens: data.usage.completion_tokens,
                  totalTokens: data.usage.total_tokens
                }
              });
            }
          }
        } catch (e) {
          // Skip invalid JSON chunks
          continue;
        }
      }
    } catch (error) {
      results.push({
        type: "error",
        error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    return results;
  }

  static parseAnthropic(chunk: string): UnifiedChunk[] {
    const results: UnifiedChunk[] = [];
    
    try {
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (!line.trim() || line.startsWith(':')) continue;
        
        const trimmed = line.replace(/^data:\s*/, '');
        if (trimmed === '[DONE]') {
          results.push({ type: "done" });
          continue;
        }
        
        try {
          const data = JSON.parse(trimmed);
          
          // Anthropic format: {type: "completion", text: "..."}
          if (data.type === 'completion') {
            if (data.text) {
              results.push({
                type: "content",
                text: data.text
              });
            }
            
            if (data.stop_reason) {
              results.push({
                type: "done",
                finishReason: data.stop_reason
              });
            }
          }
          
          // Anthropic SSE delta format
          if (data.type === 'content_block_delta' && data.delta?.text) {
            results.push({
              type: "content",
              text: data.delta.text
            });
          }
          
          if (data.type === 'message_stop') {
            results.push({ type: "done" });
          }
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      results.push({
        type: "error",
        error: `Anthropic parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    return results;
  }

  static parseOllama(chunk: string): UnifiedChunk[] {
    const results: UnifiedChunk[] = [];
    
    try {
      // Ollama uses newline-delimited JSON
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          if (data.response) {
            results.push({
              type: "content",
              text: data.response
            });
          }
          
          if (data.done) {
            results.push({
              type: "done",
              finishReason: data.done_reason || 'stop'
            });
          }
          
          if (data.eval_count || data.prompt_eval_count) {
            results.push({
              type: "content",
              usage: {
                promptTokens: data.prompt_eval_count,
                completionTokens: data.eval_count,
                totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
              }
            });
          }
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      results.push({
        type: "error",
        error: `Ollama parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
    
    return results;
  }

  static normalizeChunk(chunk: string, provider: string): UnifiedChunk[] {
    switch (provider) {
      case 'openai':
      case 'openrouter':
      case 'groq':
        return this.parseOpenAICompatible(chunk);
      case 'anthropic':
        return this.parseAnthropic(chunk);
      case 'ollama':
        return this.parseOllama(chunk);
      default:
        return [{
          type: "error",
          error: `Unsupported provider: ${provider}`
        }];
    }
  }
}

// Main streaming engine
export class AIStreamingEngine {
  private config: StreamingConfig;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private decoder = new TextDecoder();

  constructor(config: StreamingConfig) {
    this.config = config;
  }

  async *stream(): AsyncGenerator<UnifiedChunk, void, undefined> {
    const { provider, apiKey, baseUrl, model, prompt, advancedSettings } = this.config;
    
    let url: string;
    let body: any;
    let headers: Record<string, string>;

    // Setup request based on provider
    switch (provider) {
      case 'openai':
        url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        };
        body = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: advancedSettings.temperature || 0.7,
          max_tokens: advancedSettings.maxTokens || 4000,
          stream: true
        };
        break;

      case 'openrouter':
        url = 'https://openrouter.ai/api/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        };
        body = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: advancedSettings.temperature || 0.7,
          max_tokens: advancedSettings.maxTokens || 4000,
          stream: true
        };
        break;

      case 'anthropic':
        url = 'https://api.anthropic.com/v1/messages';
        headers = {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'anthropic-version': '2023-06-01'
        };
        body = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: advancedSettings.temperature || 0.7,
          max_tokens: advancedSettings.maxTokens || 4000,
          stream: true
        };
        break;

      case 'groq':
        url = 'https://api.groq.com/openai/v1/chat/completions';
        headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        };
        body = {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: advancedSettings.temperature || 0.7,
          max_tokens: advancedSettings.maxTokens || 4000,
          stream: true
        };
        break;

      case 'ollama':
        url = 'http://localhost:11434/api/generate';
        headers = {
          'Content-Type': 'application/json'
        };
        body = {
          model,
          prompt,
          stream: true
        };
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      this.reader = response.body.getReader();
      
      let buffer = '';
      
      while (true) {
        const { done, value } = await this.reader.read();
        
        if (done) {
          break;
        }
        
        const chunk = this.decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete chunks
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const unifiedChunks = StreamParser.normalizeChunk(line, provider);
          for (const unifiedChunk of unifiedChunks) {
            yield unifiedChunk;
          }
        }
      }
      
      // Process remaining buffer
      if (buffer.trim()) {
        const unifiedChunks = StreamParser.normalizeChunk(buffer, provider);
        for (const unifiedChunk of unifiedChunks) {
          yield unifiedChunk;
        }
      }
      
    } catch (error) {
      yield {
        type: "error",
        error: error instanceof Error ? error.message : 'Streaming error'
      };
    } finally {
      if (this.reader) {
        this.reader.releaseLock();
      }
    }
  }

  stop() {
    if (this.reader) {
      this.reader.cancel();
      this.reader = null;
    }
  }
}