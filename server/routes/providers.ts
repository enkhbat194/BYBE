import { Router } from 'express';
import { syncAllProviders, syncProvider } from '../services/modelSync';
import { ADAPTERS } from '../providers/registry';

const router = Router();

// Get all providers
router.get('/', async (req, res) => {
  try {
    const providers = Object.values(ADAPTERS).map(adapter => ({
      id: adapter.id,
      name: adapter.name,
      hasModels: !!adapter.fetchModels,
      enabled: true // TODO: Get from database
    }));
    
    res.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Get models for a specific provider
router.get('/:id/models', async (req, res) => {
  try {
    const { id } = req.params;
    const adapter = ADAPTERS[id];
    
    if (!adapter) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    if (!adapter.fetchModels) {
      return res.status(400).json({ error: 'Provider does not support model listing' });
    }
    
    // TODO: Get models from database instead of fetching live
    const apiKey = process.env[`${id.toUpperCase()}_API_KEY`];
    
    // Check if provider requires API key and validate
    if (!apiKey && ['openai', 'groq', 'anthropic', 'together'].includes(id)) {
      return res.status(400).json({
        error: `${adapter.name} API key not configured. Please set ${id.toUpperCase()}_API_KEY in your environment variables.`,
        models: []
      });
    }
    
    const models = await adapter.fetchModels({ apiKey });
    
    // Ensure models is always an array
    const modelArray = Array.isArray(models) ? models : [];
    
    res.json({ models: modelArray });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Trigger sync for specific provider
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await syncProvider(id);
    res.json(result);
  } catch (error) {
    console.error('Error syncing provider:', error);
    res.status(500).json({ error: (error as Error).message || 'Failed to sync provider' });
  }
});

// Get provider status/health check
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const adapter = ADAPTERS[id];
    
    if (!adapter) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    
    const apiKey = process.env[`${id.toUpperCase()}_API_KEY`];
    
    if (!adapter.ping) {
      return res.json({
        provider: id,
        status: 'unknown',
        hasApiKey: !!apiKey
      });
    }
    
    const isHealthy = await adapter.ping({ apiKey });
    
    res.json({
      provider: id,
      status: isHealthy ? 'healthy' : 'unhealthy',
      hasApiKey: !!apiKey
    });
  } catch (error) {
    console.error('Error checking provider status:', error);
    res.status(500).json({ error: 'Failed to check provider status' });
  }
});

export default router;