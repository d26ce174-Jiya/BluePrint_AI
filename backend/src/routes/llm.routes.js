import { Router } from 'express';
import { llmClient } from '../services/ai/llmClient.js';

const router = Router();

// GET /api/llm/status - returns configured providers and default model
router.get('/status', (req, res) => {
  try {
    const status = llmClient.getStatus();
    res.json({
      success: true,
      ...status,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/llm/test - tests a specific provider connection
router.post('/test', async (req, res) => {
  try {
    const { provider } = req.body || {};
    const result = await llmClient.testConnection(provider);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
