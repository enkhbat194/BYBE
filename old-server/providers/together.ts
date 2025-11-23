import { ProviderAdapter } from './types';

const TogetherAdapter: ProviderAdapter = {
  id: 'together',
  name: 'Together',
  async fetchModels(opts) {
    const { apiKey } = opts || {};
    if (!apiKey) {
      throw new Error('Together API key required');
    }
    
    try {
      const res = await fetch('https://api.together.xyz/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      
      if (!res.ok) {
        throw new Error(`Together API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      return data.data.map((m: any) => ({
        model_id: m.id,
        display_name: m.display_name || m.id,
        capabilities: m.capabilities || []
      }));
    } catch (error) {
      // Fallback to common models if API fails
      return [
        { model_id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', display_name: 'Mixtral 8x7B Instruct' },
        { model_id: 'mistralai/Mistral-7B-Instruct-v0.2', display_name: 'Mistral 7B Instruct' },
        { model_id: 'togethercomputer/alpaca-7b', display_name: 'Alpaca 7B' },
        { model_id: 'togethercomputer/RedPajama-INCITE-Chat-3B', display_name: 'RedPajama Chat 3B' }
      ];
    }
  },
  
  async chat(opts) {
    const { apiKey, model, messages, baseUrl, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, stream } = opts || {};
    
    if (!apiKey) {
      throw new Error('Together API key required');
    }
    
    const requestBody: any = {
      model,
      messages,
      stream: stream || false
    };
    
    // Add optional parameters if provided
    if (temperature !== undefined) requestBody.temperature = temperature;
    if (maxTokens !== undefined) requestBody.max_tokens = maxTokens;
    if (topP !== undefined) requestBody.top_p = topP;
    if (frequencyPenalty !== undefined) requestBody.frequency_penalty = frequencyPenalty;
    if (presencePenalty !== undefined) requestBody.presence_penalty = presencePenalty;
    
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Together API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content || '',
      model: data.model || model,
      usage: data.usage
    };
  },
  
  async ping(opts) {
    const { apiKey } = opts || {};
    if (!apiKey) return false;
    
    try {
      const res = await fetch('https://api.together.xyz/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};

export default TogetherAdapter;