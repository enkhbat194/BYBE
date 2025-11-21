export interface ProviderModel {
  model_id: string;
  display_name?: string;
  capabilities?: string[]; // ['chat','embeddings','stream']
  raw?: any;
}

export interface ProviderAdapter {
  id: string;
  name: string;
  defaultModel?: string;
  fetchModels?: (opts: { apiKey?: string, baseUrl?: string }) => Promise<ProviderModel[]>;
  ping?: (opts: { apiKey?: string, baseUrl?: string }) => Promise<boolean>;
  chat?: (opts: {
    apiKey: string;
    model: string;
    messages: Array<{ role: string; content: string }>;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stream?: boolean;
  }) => Promise<{ content: string; model?: string; usage?: any }>;
}