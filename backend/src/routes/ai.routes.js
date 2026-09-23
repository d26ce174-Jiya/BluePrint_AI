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

// POST /api/ai/scrape-url - real web scraper extracting text, headings & metadata
router.post('/scrape-url', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid URL is required' });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid URL format' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: `Remote server returned HTTP ${response.status}: ${response.statusText}`
      });
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;

    // Extract meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

    // Extract text from body
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;

    const cleaned = bodyContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();

    const excerpt = cleaned.slice(0, 1800);

    res.json({
      success: true,
      url: parsedUrl.href,
      title: pageTitle,
      description: metaDesc,
      extractedContent: `[Scraped from: ${parsedUrl.href}]\nTitle: ${pageTitle}\n${metaDesc ? `Summary: ${metaDesc}\n` : ''}\nContent:\n${excerpt}`
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.name === 'AbortError' ? 'URL request timed out after 9 seconds' : `Could not scrape URL: ${err.message}`
    });
  }
});

export default router;
