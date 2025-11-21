import { ProviderAdapter } from './types';

const OpenRouterAdapter: ProviderAdapter = {
  id: 'openrouter',
  name: 'OpenRouter',
  async fetchModels(opts) {
    const { apiKey } = opts || {};
    
    // OpenRouter can list models without API key, but authenticated users get more models
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers
    });
    
    if (!res.ok) {
      throw new Error(`OpenRouter API error: ${res.status}`);
    }
    
    const data = await res.json();
    
    return data.data.map((m: any) => m.id);
  },
  
  async chat(opts) {
    const { apiKey, model, messages, baseUrl, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, stream } = opts || {};
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const requestBody: any = {
      model,
      messages
    };
    
    // Add optional parameters if provided
    if (temperature !== undefined) requestBody.temperature = temperature;
    if (maxTokens !== undefined) requestBody.max_tokens = maxTokens;
    if (topP !== undefined) requestBody.top_p = topP;
    if (frequencyPenalty !== undefined) requestBody.frequency_penalty = frequencyPenalty;
    if (presencePenalty !== undefined) requestBody.presence_penalty = presencePenalty;
    if (stream !== undefined) requestBody.stream = stream;
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
    };
  },
  
  async ping(opts) {
    const { apiKey } = opts || {};
    
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
      return res.ok;
    } catch {
      return false;
    }
  }
};

export default OpenRouterAdapter;