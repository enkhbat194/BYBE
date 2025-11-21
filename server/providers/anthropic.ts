import { ProviderAdapter } from './types';

const AnthropicAdapter: ProviderAdapter = {
  id: 'anthropic',
  name: 'Anthropic',
  async fetchModels(opts) {
    const { apiKey } = opts || {};
    if (!apiKey) {
      throw new Error('Anthropic API key required');
    }
    
    // Anthropic doesn't have a public models endpoint, so we return common models
    return [
      { model_id: 'claude-3-opus-20240229', display_name: 'Claude 3 Opus' },
      { model_id: 'claude-3-sonnet-20240229', display_name: 'Claude 3 Sonnet' },
      { model_id: 'claude-3-haiku-20240307', display_name: 'Claude 3 Haiku' },
      { model_id: 'claude-2.1', display_name: 'Claude 2.1' },
      { model_id: 'claude-2.0', display_name: 'Claude 2.0' },
      { model_id: 'claude-instant-1.2', display_name: 'Claude Instant' }
    ];
  },
  
  async chat(opts) {
    const { apiKey, model, messages, baseUrl, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, stream } = opts || {};
    
    if (!apiKey) {
      throw new Error('Anthropic API key required');
    }
    
    // Convert OpenAI-style messages to Anthropic format
    const anthropicMessages = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));
    
    const systemPrompt = messages.find(msg => msg.role === 'system')?.content;
    
    const requestBody: any = {
      model,
      messages: anthropicMessages,
      max_tokens: maxTokens || 4096
    };
    
    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }
    
    // Add optional parameters if provided
    if (temperature !== undefined) requestBody.temperature = temperature;
    if (topP !== undefined) requestBody.top_p = topP;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      content: data.content[0]?.text || '',
      model: data.model,
      usage: {
        prompt_tokens: data.usage?.input_tokens,
        completion_tokens: data.usage?.output_tokens,
        total_tokens: data.usage?.input_tokens + data.usage?.output_tokens
      }
    };
  },
  
  async ping(opts) {
    const { apiKey } = opts || {};
    if (!apiKey) return false;
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }]
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};

export default AnthropicAdapter;