import { db } from '../db';
import { eq } from 'drizzle-orm';
import { providers } from '../schema';
import { createLogger } from './logger';

const logger = createLogger('ProviderSettings');

// Provider configuration interface
export interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  settings: {
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    retries?: number;
    rateLimit?: {
      requests: number;
      windowMs: number;
    };
    advanced?: {
      streaming?: boolean;
      compression?: boolean;
      toolChoice?: string;
      responseFormat?: string;
    };
  };
  capabilities: {
    chat: boolean;
    embeddings: boolean;
    transcription: boolean;
    moderation: boolean;
  };
  metadata: Record<string, any>;
}

// Default configurations for each provider
const DEFAULT_CONFIGS: Record<string, Partial<ProviderConfig>> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    settings: {
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 30000,
      retries: 3,
      rateLimit: {
        requests: 60,
        windowMs: 60000
      },
      advanced: {
        streaming: true,
        compression: false,
        toolChoice: 'auto',
        responseFormat: 'text'
      }
    },
    capabilities: {
      chat: true,
      embeddings: true,
      transcription: true,
      moderation: true
    },
    metadata: {
      official: true,
      supportsVision: true,
      supportsFunctions: true,
      modelsUrl: 'https://api.openai.com/v1/models'
    }
  },
  
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com',
    settings: {
      temperature: 0.7,
      maxTokens: 8192,
      timeout: 30000,
      retries: 3,
      rateLimit: {
        requests: 100,
        windowMs: 60000
      },
      advanced: {
        streaming: true,
        compression: false,
        toolChoice: 'auto',
        responseFormat: 'text'
      }
    },
    capabilities: {
      chat: true,
      embeddings: false,
      transcription: false,
      moderation: false
    },
    metadata: {
      official: true,
      supportsVision: false,
      supportsFunctions: true,
      modelsUrl: 'https://api.groq.com/openai/v1/models'
    }
  },

  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai',
    settings: {
      temperature: 0.7,
      maxTokens: 4000,
      timeout: 30000,
      retries: 3,
      rateLimit: {
        requests: 60,
        windowMs: 60000
      },
      advanced: {
        streaming: true,
        compression: false,
        toolChoice: 'auto',
        responseFormat: 'text'
      }
    },
    capabilities: {
      chat: true,
      embeddings: true,
      transcription: false,
      moderation: false
    },
    metadata: {
      official: false,
      supportsVision: true,
      supportsFunctions: true,
      modelsUrl: 'https://openrouter.ai/api/v1/models',
      aggregator: true
    }
  }
};

export class ProviderSettingsService {
  private configs: Map<string, ProviderConfig> = new Map();

  constructor() {
    this.loadDefaultConfigs();
  }

  private loadDefaultConfigs() {
    Object.entries(DEFAULT_CONFIGS).forEach(([providerId, config]) => {
      this.configs.set(providerId, {
        id: providerId,
        ...config,
        enabled: true,
        settings: config.settings!,
        capabilities: config.capabilities!,
        metadata: config.metadata!
      } as ProviderConfig);
    });
  }

  /**
   * Get provider configuration
   */
  getConfig(providerId: string): ProviderConfig | null {
    return this.configs.get(providerId) || null;
  }

  /**
   * Update provider configuration
   */
  updateConfig(providerId: string, updates: Partial<ProviderConfig>): boolean {
    const config = this.configs.get(providerId);
    if (!config) {
      logger.warn(`Attempted to update non-existent provider config: ${providerId}`);
      return false;
    }

    // Merge updates
    const updatedConfig = { ...config, ...updates };
    this.configs.set(providerId, updatedConfig);

    logger.info(`Updated provider config: ${providerId}`, { updates });
    return true;
  }

  /**
   * Enable/disable provider
   */
  setProviderEnabled(providerId: string, enabled: boolean): boolean {
    const config = this.configs.get(providerId);
    if (!config) {
      logger.warn(`Attempted to ${enabled ? 'enable' : 'disable'} non-existent provider: ${providerId}`);
      return false;
    }

    config.enabled = enabled;
    this.configs.set(providerId, config);

    logger.info(`Provider ${providerId} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Update API key for provider
   */
  updateApiKey(providerId: string, apiKey: string): boolean {
    const config = this.configs.get(providerId);
    if (!config) {
      logger.warn(`Attempted to update API key for non-existent provider: ${providerId}`);
      return false;
    }

    config.apiKey = apiKey;
    this.configs.set(providerId, config);

    logger.info(`Updated API key for provider: ${providerId}`);
    return true;
  }

  /**
   * Update provider settings
   */
  updateSettings(providerId: string, settings: Partial<ProviderConfig['settings']>): boolean {
    const config = this.configs.get(providerId);
    if (!config) {
      logger.warn(`Attempted to update settings for non-existent provider: ${providerId}`);
      return false;
    }

    config.settings = { ...config.settings, ...settings };
    this.configs.set(providerId, config);

    logger.info(`Updated settings for provider: ${providerId}`, { settings });
    return true;
  }

  /**
   * Get all provider configurations
   */
  getAllConfigs(): ProviderConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Get enabled providers only
   */
  getEnabledConfigs(): ProviderConfig[] {
    return Array.from(this.configs.values()).filter(config => config.enabled);
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(providerId: string): ProviderConfig['capabilities'] | null {
    const config = this.configs.get(providerId);
    return config?.capabilities || null;
  }

  /**
   * Validate provider settings
   */
  validateSettings(providerId: string, settings: Partial<ProviderConfig['settings']>): {
    valid: boolean;
    errors: string[];
  } {
    const config = this.configs.get(providerId);
    if (!config) {
      return { valid: false, errors: ['Provider not found'] };
    }

    const errors: string[] = [];

    if (settings.temperature !== undefined) {
      if (settings.temperature < 0 || settings.temperature > 2) {
        errors.push('Temperature must be between 0 and 2');
      }
    }

    if (settings.maxTokens !== undefined) {
      if (settings.maxTokens < 1 || settings.maxTokens > 100000) {
        errors.push('Max tokens must be between 1 and 100000');
      }
    }

    if (settings.timeout !== undefined) {
      if (settings.timeout < 1000 || settings.timeout > 300000) {
        errors.push('Timeout must be between 1000ms and 300000ms');
      }
    }

    if (settings.retries !== undefined) {
      if (settings.retries < 0 || settings.retries > 10) {
        errors.push('Retries must be between 0 and 10');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset provider config to defaults
   */
  resetToDefaults(providerId: string): boolean {
    const defaultConfig = DEFAULT_CONFIGS[providerId];
    if (!defaultConfig) {
      logger.warn(`No default config found for provider: ${providerId}`);
      return false;
    }

    this.configs.set(providerId, {
      id: providerId,
      ...defaultConfig,
      enabled: true,
      settings: defaultConfig.settings!,
      capabilities: defaultConfig.capabilities!,
      metadata: defaultConfig.metadata!
    } as ProviderConfig);

    logger.info(`Reset provider config to defaults: ${providerId}`);
    return true;
  }

  /**
   * Export configuration for backup
   */
  exportConfig(): Record<string, ProviderConfig> {
    return Object.fromEntries(this.configs);
  }

  /**
   * Import configuration from backup
   */
  importConfig(configs: Record<string, ProviderConfig>): void {
    Object.entries(configs).forEach(([providerId, config]) => {
      this.configs.set(providerId, config);
    });
    logger.info('Imported provider configurations', { count: Object.keys(configs).length });
  }
}

export const providerSettingsService = new ProviderSettingsService();