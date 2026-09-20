import { Router } from 'express';
import { inputAnalyzer } from '../services/ai/inputAnalyzer.js';
import { compileAiClient } from '../services/ai/compileAiClient.js';

const router = Router();

// GET /api/ai/model-stats - status and metrics of the Compile AI model
router.get('/model-stats', async (req, res) => {
  try {
    const isHealthy = await compileAiClient.isHealthy();
    const stats = inputAnalyzer.getModelStats();
    res.json({
      success: true,
      compileAiServerHealthy: isHealthy,
      stats,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/validate - evaluates whether input is valid business requirement
router.post('/validate', async (req, res) => {
  try {
    const { text = '' } = req.body || {};
    const validation = await inputAnalyzer.validateInput(text);
    res.json({
      success: true,
      validation,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/classify - run trained scikit-learn field classifier
router.post('/classify', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required for classification' });
    }
    const classification = await compileAiClient.classify(text);
    res.json({
      success: true,
      classification,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/compile - run full end-to-end Compile AI pipeline
router.post('/compile', async (req, res) => {
  try {
    const { text, language, industry, company_size_tag, budget, timeline_weeks, tech_stack } = req.body || {};
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required for Compile AI pipeline' });
    }
    const result = await compileAiClient.compile({
      text,
      language,
      industry,
      company_size_tag,
      budget,
      timeline_weeks,
      tech_stack,
    });
    res.json({
      success: true,
      result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/ai/analyze - analyze raw user input
router.post('/analyze', async (req, res) => {
  try {
    const { text, context } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Text field is required for analysis' });
    }

    const analysis = await inputAnalyzer.analyze(text, context);
    res.json({
      success: true,
      analysis,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
