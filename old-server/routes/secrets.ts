import { Router } from 'express';
import { SecretsService } from '../services/secrets';

const router = Router();

// Store API key for a provider
router.post('/api-keys', async (req, res) => {
  try {
    const { providerId, apiKey } = req.body;
    
    if (!providerId || !apiKey) {
      return res.status(400).json({ error: 'Provider ID and API key are required' });
    }
    
    // Validate provider exists
    // TODO: Check against actual providers list
    
    SecretsService.storeApiKey(providerId, apiKey);
    
    res.json({ success: true, message: 'API key stored successfully' });
  } catch (error) {
    console.error('Error storing API key:', error);
    res.status(500).json({ error: 'Failed to store API key' });
  }
});

// Get API key for a provider (for server use only, not exposed to client)
router.get('/api-keys/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    // This endpoint should be protected and only used internally
    // In production, add proper authentication and authorization
    
    const apiKey = SecretsService.getApiKey(providerId);
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({ apiKey });
  } catch (error) {
    console.error('Error retrieving API key:', error);
    res.status(500).json({ error: 'Failed to retrieve API key' });
  }
});

// Delete API key for a provider
router.delete('/api-keys/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const deleted = SecretsService.deleteApiKey(providerId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({ success: true, message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Get status of stored secrets (for debugging)
router.get('/status', async (req, res) => {
  try {
    // This endpoint should be protected in production
    
    const providers = ['openai', 'groq', 'openrouter'];
    const status = providers.map(provider => ({
      provider,
      hasApiKey: !!SecretsService.getApiKey(provider)
    }));
    
    res.json({ secrets: status });
  } catch (error) {
    console.error('Error checking secrets status:', error);
    res.status(500).json({ error: 'Failed to check secrets status' });
  }
});

export default router;