import { storage } from '../storage';
import { ADAPTERS } from '../providers/registry';

// Broadcast function placeholder - will be implemented with WebSocket later
function broadcast(event: string, data: any) {
  // TODO: Implement WebSocket/SSE broadcasting
  console.log(`Broadcast: ${event}`, data);
}

export async function syncAllProviders() {
  console.log('Starting provider model sync...');
  
  for (const key of Object.keys(ADAPTERS)) {
    const adapter = ADAPTERS[key];
    try {
      console.log(`Syncing provider: ${key}`);
      
      // Check if provider exists and is enabled (simple check for now)
      const enabledProviders = ['openai', 'groq', 'openrouter'];
      if (!enabledProviders.includes(key)) {
        console.log(`Provider ${key} not found or disabled, skipping`);
        continue;
      }
      
      // TODO: Get API key from encrypted secrets storage
      const apiKey = process.env[`${key.toUpperCase()}_API_KEY`];
      
      if (!adapter.fetchModels) {
        console.log(`Provider ${key} does not support model fetching`);
        continue;
      }
      
      const models = await adapter.fetchModels({ apiKey });
      console.log(`Fetched ${models.length} models for ${key}`);
      
      // Store models in memory for now (TODO: Replace with database when available)
      console.log(`Would store ${models.length} models for provider ${key}`);
      // TODO: Implement actual storage when database is ready
      
      // Broadcast update to clients
      broadcast('models.updated', { provider: key, count: models.length });
      
    } catch (err) {
      console.error('Sync error for provider', key, err);
    }
  }
  
  console.log('Provider model sync completed');
}

// Manual sync for specific provider
export async function syncProvider(providerId: string) {
  const adapter = ADAPTERS[providerId];
  if (!adapter) {
    throw new Error(`Provider ${providerId} not found`);
  }
  
  try {
    // Check if provider exists (simple check for now)
    const enabledProviders = ['openai', 'groq', 'openrouter'];
    if (!enabledProviders.includes(providerId)) {
      throw new Error(`Provider ${providerId} not found or disabled`);
    }
    
    const apiKey = process.env[`${providerId.toUpperCase()}_API_KEY`];
    
    if (!adapter.fetchModels) {
      throw new Error(`Provider ${providerId} does not support model fetching`);
    }
    
    const models = await adapter.fetchModels({ apiKey });
    
    // Store models in memory for now (TODO: Replace with database when available)
    console.log(`Would store ${models.length} models for provider ${providerId}`);
    // TODO: Implement actual storage when database is ready
    
    broadcast('models.updated', { provider: providerId, count: models.length });
    
    return { success: true, count: models.length };
  } catch (err) {
    console.error('Manual sync error for provider', providerId, err);
    throw err;
  }
}