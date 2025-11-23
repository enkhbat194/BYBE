import { create } from 'zustand';
import {
  BUILTIN_PROVIDERS,
  getProviderConfig,
  type AIProviderConfig as ProviderConfig,
} from './providers';

export type AIProviderConfig = ProviderConfig;

// -------- Behavior Settings --------
export type CodeQuality = 'low' | 'balanced' | 'high';

export interface AdvancedSettings {
  // Behavior
  streamResponse: boolean;
  temperature: number;
  maxTokens?: number;
  systemPrompt?: string;
  autocompleteEnabled: boolean;
  inlineSuggestions: boolean;
  codeQuality: CodeQuality;

  // Agent settings (Pro mode)
  reasoningDepth: number;      // 1–5
  planningEnabled: boolean;
  toolUsageAllowed: boolean;
  contextWindowSize: number;   // tokens
  autoDebugEnabled: boolean;
  multiFileAgent: boolean;
}

// -------- Model info --------
export interface AIModelInfo {
  id: string;
  name: string;
  description?: string;
  providerId: string;
}

export interface AIConfigState {
  providers: AIProviderConfig[];
  selectedProviderId: string;
  selectedModelId: string | null;

  // providerId -> apiKey
  apiKeys: Record<string, string>;

  // providerId -> [models]
  modelsByProvider: Record<string, AIModelInfo[]>;
  lastSyncedAt: Record<string, number | undefined>;

  advancedSettings: AdvancedSettings;

  setSelectedProvider: (id: string) => void;
  setSelectedModel: (id: string | null) => void;
  setApiKey: (providerId: string, key: string) => void;

  setAdvancedSettings: (patch: Partial<AdvancedSettings>) => void;

  syncModelsForProvider: (providerId: string) => Promise<void>;
}

export const useAIConfigStore = create<AIConfigState>((set, get) => ({
  providers: BUILTIN_PROVIDERS,
  selectedProviderId: 'openrouter',
  selectedModelId: null,

  apiKeys: {
    cursor: '',
    openrouter: '',
    openai: '',
    anthropic: '',
    groq: '',
    ollama: '',
  },

  modelsByProvider: {},
  lastSyncedAt: {},

  advancedSettings: {
    // Behavior defaults
    streamResponse: true,
    temperature: 0.2,
    maxTokens: 2048,
    systemPrompt: '',
    autocompleteEnabled: true,
    inlineSuggestions: true,
    codeQuality: 'balanced',

    // Agent defaults
    reasoningDepth: 3,
    planningEnabled: true,
    toolUsageAllowed: true,
    contextWindowSize: 16000,
    autoDebugEnabled: false,
    multiFileAgent: true,
  },

  setSelectedProvider: (id) => {
    set({ selectedProviderId: id, selectedModelId: null });
  },

  setSelectedModel: (id) => set({ selectedModelId: id }),

  setApiKey: (providerId, key) =>
    set((state) => ({
      apiKeys: {
        ...state.apiKeys,
        [providerId]: key,
      },
    })),

  setAdvancedSettings: (patch) =>
    set((state) => ({
      advancedSettings: {
        ...state.advancedSettings,
        ...patch,
      },
    })),

  syncModelsForProvider: async (providerId: string) => {
    const state = get();
    const provider = getProviderConfig(providerId);
    if (!provider) return;

    // simple cache: 1 цаг тутамд шинэчлэх
    const last = state.lastSyncedAt[providerId] ?? 0;
    if (
      Date.now() - last < 60 * 60 * 1000 &&
      state.modelsByProvider[providerId]
    ) {
      return;
    }

    try {
      let models: AIModelInfo[] = [];

      if (providerId === 'openrouter') {
        const apiKey = state.apiKeys['openrouter'];
        if (!apiKey) throw new Error('OpenRouter API key is not set');

        const resp = await fetch('https://openrouter.ai/api/v1/models', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        const data = await resp.json();
        models = (data.data ?? []).map((m: any) => ({
          id: m.id, // e.g. "openai/gpt-4o-mini"
          name: m.name ?? m.id,
          description: m.description,
          providerId,
        }));
      } else if (provider.kind === 'openai-compatible') {
        const apiKey = state.apiKeys[providerId];
        if (!apiKey) throw new Error(`${provider.name} API key is not set`);

        const resp = await fetch(
          provider.baseUrl! + (provider.modelsEndpoint ?? '/models'),
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );
        const data = await resp.json();
        models = (data.data ?? []).map((m: any) => ({
          id: m.id,
          name: m.id,
          providerId,
        }));
      } else if (provider.kind === 'anthropic') {
        // Anthropic-д одоогоор статикийн
        models = [
          {
            id: 'claude-3-5-sonnet-latest',
            name: 'Claude 3.5 Sonnet',
            providerId,
          },
          {
            id: 'claude-3-5-haiku-latest',
            name: 'Claude 3.5 Haiku',
            providerId,
          },
        ];
      } else if (provider.kind === 'ollama') {
        try {
          const resp = await fetch(
            (provider.baseUrl ?? 'http://localhost:11434') + '/api/tags'
          );
          const data = await resp.json();
          models = (data.models ?? []).map((m: any) => ({
            id: m.name,
            name: m.name,
            providerId,
          }));
        } catch {
          models = [];
        }
      } else if (provider.kind === 'cursor') {
        // Cursor AI — basic static list
        models = [
          {
            id: 'claude-3-5-sonnet-latest',
            name: 'Claude 3.5 Sonnet (default)',
            providerId,
          },
          {
            id: 'claude-3-5-haiku-latest',
            name: 'Claude 3.5 Haiku',
            providerId,
          },
        ];
      }

      set((state) => ({
        modelsByProvider: {
          ...state.modelsByProvider,
          [providerId]: models,
        },
        lastSyncedAt: {
          ...state.lastSyncedAt,
          [providerId]: Date.now(),
        },
        selectedModelId:
          state.selectedProviderId === providerId &&
          !state.selectedModelId &&
          models[0]
            ? models[0].id
            : state.selectedModelId,
      }));
    } catch (err) {
      console.error('Failed to sync models for provider', providerId, err);
    }
  },
}));
