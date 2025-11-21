import { ProviderAdapter } from './types';

const OllamaAdapter: ProviderAdapter = {
  id: 'ollama',
  name: 'Ollama',
  async fetchModels(opts) {
    const { apiKey, baseUrl } = opts || {};
    
    // Ollama typically runs locally, so no API key required
    const ollamaUrl = baseUrl || 'http://localhost:11434';
    
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`);
      
      if (!res.ok) {
        throw new Error(`Ollama API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      return data.models.map((m: any) => ({
        model_id: m.name,
        display_name: m.name,
        capabilities: ['chat']
      }));
    } catch (error) {
      // Fallback to common Ollama models if API fails
      return [
        { model_id: 'llama2', display_name: 'Llama 2' },
        { model_id: 'mistral', display_name: 'Mistral' },
        { model_id: 'codellama', display_name: 'CodeLlama' },
        { model_id: 'vicuna', display_name: 'Vicuña' },
        { model_id: 'alpaca', display_name: 'Alpaca' }
      ];
    }
  },
  
  async chat(opts) {
    const { apiKey, model, messages, baseUrl, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, stream } = opts || {};
    
    const ollamaUrl = baseUrl || 'http://localhost:11434';
    
    // Convert messages to Ollama format
    const prompt = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n') + '\nassistant:';
    
    const requestBody: any = {
      model,
      prompt,
      stream: stream || false
    };
    
    // Add optional parameters if provided
    if (temperature !== undefined) requestBody.temperature = temperature;
    if (maxTokens !== undefined) requestBody.num_predict = maxTokens;
    if (topP !== undefined) requestBody.top_p = topP;
    
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.response || '',
      model: model,
      usage: {
        prompt_eval_count: data.prompt_eval_count,
        eval_count: data.eval_count
      }
    };
  },
  
  async ping(opts) {
    const { baseUrl } = opts || {};
    const ollamaUrl = baseUrl || 'http://localhost:11434';
    
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }
};

export default OllamaAdapter;