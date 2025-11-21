import { ProviderAdapter } from './types';
import OpenAIAdapter from './openai.js';
import GroqAdapter from './groq.js';
import OpenRouterAdapter from './openrouter.js';
import AnthropicAdapter from './anthropic.js';
import TogetherAdapter from './together.js';
import OllamaAdapter from './ollama.js';

export const ADAPTERS: Record<string, ProviderAdapter> = {
  openai: OpenAIAdapter,
  groq: GroqAdapter,
  openrouter: OpenRouterAdapter,
  anthropic: AnthropicAdapter,
  together: TogetherAdapter,
  ollama: OllamaAdapter,
};

export function getAdapter(providerId: string): ProviderAdapter | undefined {
  return ADAPTERS[providerId];
}

export function getAllAdapters(): ProviderAdapter[] {
  return Object.values(ADAPTERS);
}