import { env } from '../../config/env.js';

/**
 * Universal Multi-LLM Client wrapper.
 * Supports Google Gemini, OpenAI, Anthropic Claude, Groq, DeepSeek, and Ollama.
 * Falls back to structured smart heuristic synthesis if no API keys are provided
 * or if remote API calls encounter errors.
 */

// Helper: Safely parse JSON even if wrapped in markdown or leading/trailing text
function parseJsonResponse(text) {
  if (typeof text === 'object' && text !== null) return text;
  if (!text || typeof text !== 'string') return null;

  try {
    return JSON.parse(text);
  } catch (err) {
    const cleaned = text
      .replace(/^\`\`\`(?:json)?\s*/i, '')
      .replace(/\`\`\`\s*$/i, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (cleanErr) {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        } catch (e) {}
      }

      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        try {
          return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
        } catch (e) {}
      }

      throw cleanErr;
    }
  }
}

// 1. Google Gemini REST API (v1beta)
async function callGemini({ apiKey, model, systemPrompt, userPrompt, jsonMode }) {
  let targetModel = (model || env.GEMINI_MODEL || 'gemini-3.8-flash').trim();
  const lower = targetModel.toLowerCase();
  if (
    lower.includes('1.5') ||
    lower.includes('2.0') ||
    lower.includes('2.5') ||
    lower === 'gemini-pro' ||
    lower === 'models/gemini-pro' ||
    !targetModel
  ) {
    targetModel = 'gemini-3.8-flash';
  }
  const cleanModel = targetModel.replace(/^models\//, '');

  // Small, explicitly configured list of verified models: primary first, then verified fallback
  const candidateModels = Array.from(new Set([cleanModel, 'gemini-3.5-flash']));

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: env.LLM_TEMPERATURE,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  if (systemPrompt && systemPrompt.trim()) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt.trim() }],
    };
  }

  let lastErr = null;

  for (const currentModel of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          if ((response.status === 503 || response.status === 429) && attempt < 2) {
            const jitter = Math.floor(Math.random() * 500) + 200; // 200ms - 700ms jitter
            const backoff = 1500 * Math.pow(2, attempt - 1) + jitter;
            console.warn(`[Gemini] Transient ${response.status} on ${currentModel}. Retrying in ${backoff}ms with jitter...`);
            await new Promise((r) => setTimeout(r, backoff));
            continue;
          }
          throw new Error(`Gemini API Error [${response.status}] model ${currentModel}: ${errText.substring(0, 300)}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (!candidate) {
          throw new Error(`Gemini returned no candidates. Prompt feedback: ${JSON.stringify(data.promptFeedback || {})}`);
        }

        const parts = candidate.content?.parts || [];
        return parts.map((p) => p.text || '').filter(Boolean).join('');
      } catch (err) {
        lastErr = err;
        if (attempt < 2 && (err.message.includes('503') || err.message.includes('429'))) {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        // Try next candidate model if 503 or 404
        console.warn(`[Gemini] Model ${currentModel} failed (${err.message.substring(0, 100)}). Trying candidate fallback...`);
        break;
      }
    }
  }
  throw lastErr;
}

// 2. OpenAI & OpenAI-compatible APIs (OpenAI, Groq, DeepSeek, Ollama)
async function callOpenAiCompatible({ baseUrl, apiKey, model, systemPrompt, userPrompt, jsonMode }) {
  const messages = [];
  if (systemPrompt && systemPrompt.trim()) {
    messages.push({ role: 'system', content: systemPrompt.trim() });
  }

  let adjustedUserPrompt = userPrompt;
  if (jsonMode) {
    const hasJsonWord = (systemPrompt + ' ' + userPrompt).toLowerCase().includes('json');
    if (!hasJsonWord) {
      adjustedUserPrompt += '\n\nOutput strictly valid JSON.';
    }
  }

  messages.push({ role: 'user', content: adjustedUserPrompt });

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const body = {
    model,
    messages,
    temperature: env.LLM_TEMPERATURE,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      throw new Error(`OpenAI 429 Quota/Rate Limit: ${errText.substring(0, 250)}`);
    }
    throw new Error(`OpenAI-compatible API Error [${response.status}] from ${endpoint}: ${errText.substring(0, 250)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 3. Anthropic Claude API
async function callAnthropic({ apiKey, model, systemPrompt, userPrompt }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: env.LLM_TEMPERATURE,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API Error [${response.status}]: ${errText.substring(0, 250)}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

export const llmClient = {
  /**
   * Determine candidate providers based on configuration and available API keys.
   * Priority: Gemini is first because active key is verified with 100% quota,
   * followed by OpenAI, Anthropic, Groq, DeepSeek, Ollama.
   */
  getAvailableProviders() {
    const available = [];
    if (env.GEMINI_API_KEY) available.push('gemini');
    if (env.OPENAI_API_KEY) available.push('openai');
    if (env.ANTHROPIC_API_KEY) available.push('anthropic');
    if (env.GROQ_API_KEY) available.push('groq');
    if (env.DEEPSEEK_API_KEY) available.push('deepseek');
    if (env.OLLAMA_BASE_URL && env.LLM_PROVIDER === 'ollama') available.push('ollama');
    return available;
  },

  /**
   * Returns current provider status and configuration info
   */
  getStatus() {
    const providers = [
      {
        id: 'gemini',
        name: 'Google Gemini',
        configured: Boolean(env.GEMINI_API_KEY),
        model: env.GEMINI_MODEL || 'gemini-3.6-flash',
        isDefaultActive: true,
      },
      {
        id: 'openai',
        name: 'OpenAI',
        configured: Boolean(env.OPENAI_API_KEY),
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        isDefaultActive: false,
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        configured: Boolean(env.ANTHROPIC_API_KEY),
        model: env.ANTHROPIC_MODEL,
        isDefaultActive: false,
      },
      {
        id: 'groq',
        name: 'Groq',
        configured: Boolean(env.GROQ_API_KEY),
        model: env.GROQ_MODEL,
        isDefaultActive: false,
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        configured: Boolean(env.DEEPSEEK_API_KEY),
        model: env.DEEPSEEK_MODEL,
        isDefaultActive: false,
      },
      {
        id: 'ollama',
        name: 'Ollama (Local)',
        configured: Boolean(env.OLLAMA_BASE_URL),
        model: env.OLLAMA_MODEL,
        isDefaultActive: false,
      },
    ];

    return {
      configuredProvider: env.LLM_PROVIDER,
      availableProviders: this.getAvailableProviders(),
      primaryProvider: this.getAvailableProviders()[0] || 'heuristics',
      providers,
      fallbackToHeuristics: env.FALLBACK_TO_HEURISTICS,
    };
  },

  /**
   * Test connection with a simple prompt
   */
  async testConnection(providerName) {
    const targetProvider = providerName ? providerName.toLowerCase() : (this.getAvailableProviders()[0] || 'auto');
    const systemPrompt = 'You are a test assistant. Respond in JSON.';
    const userPrompt = 'Return JSON: {"status": "ok", "provider": "' + targetProvider + '"}';

    try {
      const res = await this.complete({
        systemPrompt,
        userPrompt,
        jsonMode: true,
        provider: targetProvider === 'auto' ? undefined : targetProvider,
      });

      return {
        success: Boolean(res),
        provider: targetProvider,
        data: res,
      };
    } catch (err) {
      return {
        success: false,
        provider: targetProvider,
        error: err.message,
      };
    }
  },

  /**
   * Universal complete method with automatic multi-provider fallback.
   */
  async complete({
    systemPrompt = '',
    userPrompt = '',
    jsonMode = false,
    provider: requestedProvider,
    model: requestedModel,
  }) {
    const configuredProvider = (requestedProvider || env.LLM_PROVIDER || 'auto').toLowerCase();

    // Determine list of providers to attempt in order
    let providersToTry = [];
    if (configuredProvider !== 'auto') {
      providersToTry.push(configuredProvider);
    } else {
      // Auto order: check all configured keys starting with active Gemini
      providersToTry = this.getAvailableProviders();
    }

    let lastError = null;

    for (const provider of providersToTry) {
      try {
        let rawText = '';

        switch (provider) {
          case 'gemini':
          case 'google':
            if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
            rawText = await callGemini({
              apiKey: env.GEMINI_API_KEY,
              model: requestedModel || env.GEMINI_MODEL,
              systemPrompt,
              userPrompt,
              jsonMode,
            });
            break;

          case 'openai':
            if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
            rawText = await callOpenAiCompatible({
              baseUrl: env.OPENAI_BASE_URL,
              apiKey: env.OPENAI_API_KEY,
              model: requestedModel || env.OPENAI_MODEL,
              systemPrompt,
              userPrompt,
              jsonMode,
            });
            break;

          case 'anthropic':
            if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured');
            rawText = await callAnthropic({
              apiKey: env.ANTHROPIC_API_KEY,
              model: requestedModel || env.ANTHROPIC_MODEL,
              systemPrompt,
              userPrompt,
            });
            break;

          case 'groq':
            if (!env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured');
            rawText = await callOpenAiCompatible({
              baseUrl: 'https://api.groq.com/openai/v1',
              apiKey: env.GROQ_API_KEY,
              model: requestedModel || env.GROQ_MODEL,
              systemPrompt,
              userPrompt,
              jsonMode,
            });
            break;

          case 'deepseek':
            if (!env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY is not configured');
            rawText = await callOpenAiCompatible({
              baseUrl: env.DEEPSEEK_BASE_URL,
              apiKey: env.DEEPSEEK_API_KEY,
              model: requestedModel || env.DEEPSEEK_MODEL,
              systemPrompt,
              userPrompt,
              jsonMode,
            });
            break;

          case 'ollama':
            rawText = await callOpenAiCompatible({
              baseUrl: `${env.OLLAMA_BASE_URL.replace(/\/+$/, '')}/v1`,
              apiKey: '',
              model: requestedModel || env.OLLAMA_MODEL,
              systemPrompt,
              userPrompt,
              jsonMode,
            });
            break;

          default:
            throw new Error(`Unsupported LLM provider: ${provider}`);
        }

        if (jsonMode) {
          const parsed = parseJsonResponse(rawText);
          if (parsed !== null) return parsed;
        }
        return rawText;
      } catch (err) {
        lastError = err;
        console.warn(`[Multi-LLM] Provider '${provider}' failed: ${err.message}. Trying next available provider...`);
      }
    }

    if (providersToTry.length > 0 && lastError) {
      console.warn(`[Multi-LLM] All configured live LLM providers failed (${providersToTry.join(', ')}). Falling back to smart heuristic synthesis.`);
    }

    // Heuristic Synthesis Mode (Fallback)
    return null;
  },
};
