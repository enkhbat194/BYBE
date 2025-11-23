import { ProviderAdapter } from './types';

const GroqAdapter: ProviderAdapter = {
  id: 'groq',
  name: 'Groq',
  async fetchModels(opts) {
    const { apiKey } = opts || {};
    if (!apiKey) {
      throw new Error('Groq API key required');
    }
    
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    
    if (!res.ok) {
      throw new Error(`Groq API error: ${res.status}`);
    }
    
    const data = await res.json();
    
    return data.data.map((m: any) => m.id);
  },
  
  async chat(opts) {
    const { apiKey, model, messages, baseUrl, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, stream } = opts || {};
    
    if (!apiKey) {
      throw new Error('Groq API key required');
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
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
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
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};

export default GroqAdapter;