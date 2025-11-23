export type ProviderKind =
  | 'cursor'            // Cursor AI (Claude 3.5 Sonnet default)
  | 'openai-compatible' // OpenAI, Groq, OpenRouter зэрэг
  | 'anthropic'
  | 'ollama';

export interface AIProviderConfig {
  id: string;          // 'cursor', 'openai', 'openrouter', 'groq', 'anthropic', 'ollama'
  name: string;        // Display name
  kind: ProviderKind;
  baseUrl?: string;    // openai-compatible, ollama гэх мэтэд
  modelsEndpoint?: string;
  defaultModel?: string;
  description?: string;
  officialSite?: string;
}

export const BUILTIN_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'cursor',
    name: 'Cursor AI (Claude 3.5 Sonnet)',
    kind: 'cursor',
    description: 'Built-in Cursor AI — Claude 3.5 Sonnet as default model',
    defaultModel: 'claude-3-5-sonnet-latest',
    officialSite: 'https://cursor.com',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    kind: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    modelsEndpoint: '/models',
    defaultModel: 'gpt-4o-mini',
    description: 'OpenAI GPT-4o, GPT-4o mini and more.',
    officialSite: 'https://platform.openai.com',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    kind: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelsEndpoint: '/models',
    defaultModel: 'openai/gpt-4o-mini',
    description: 'Unified gateway for many models (OpenAI, Anthropic, LLaMA, etc.)',
    officialSite: 'https://openrouter.ai',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    kind: 'anthropic',
    defaultModel: 'claude-3-5-sonnet-latest',
    description: 'Claude 3.x family.',
    officialSite: 'https://www.anthropic.com',
  },
  {
    id: 'groq',
    name: 'Groq',
    kind: 'openai-compatible',
    baseUrl: 'https://api.groq.com/openai/v1',
    modelsEndpoint: '/models',
    defaultModel: 'llama-3.1-70b-versatile',
    description: 'Very fast inference for LLaMA models.',
    officialSite: 'https://groq.com',
  },
  {
    id: 'ollama',
    name: 'Local (Ollama)',
    kind: 'ollama',
    baseUrl: 'http://localhost:11434',
    modelsEndpoint: '/api/tags',
    defaultModel: 'llama3.1',
    description: 'Local models via Ollama.',
    officialSite: 'https://ollama.com',
  },
];

export function getProviderConfig(id: string): AIProviderConfig | undefined {
  return BUILTIN_PROVIDERS.find((p) => p.id === id);
}
