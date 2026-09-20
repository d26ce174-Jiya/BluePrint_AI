import { env } from '../../config/env.js';

const COMPILE_AI_BASE_URL = process.env.COMPILE_AI_URL || 'http://127.0.0.1:8000';

/**
 * Client service connecting Node.js backend to the Python Compile AI server.
 * Interacts with the trained Tier 1 scikit-learn classifier model & Gemini consultant pipeline.
 */
export const compileAiClient = {
  baseUrl: COMPILE_AI_BASE_URL,

  async isHealthy() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return false;
      const data = await res.json();
      return data.status === 'ok';
    } catch (err) {
      return false;
    }
  },

  async classify(text) {
    const res = await fetch(`${this.baseUrl}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Compile AI Classify Error [${res.status}]: ${errText}`);
    }
    return await res.json();
  },

  async discover(rawInputText, userLanguage = 'English') {
    const res = await fetch(`${this.baseUrl}/consultant/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_input_text: rawInputText,
        user_language: userLanguage,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Compile AI Discover Error [${res.status}]: ${errText}`);
    }
    return await res.json();
  },

  async generate(rawInputText, discoveryAnswers = {}, section = 'all', userLanguage = 'English') {
    const res = await fetch(`${this.baseUrl}/consultant/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        raw_input_text: rawInputText,
        discovery_answers: discoveryAnswers,
        section,
        user_language: userLanguage,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Compile AI Generate Error [${res.status}]: ${errText}`);
    }
    return await res.json();
  },

  async compile({ text, language = 'English', industry = '', company_size_tag = '', budget = null, timeline_weeks = null, tech_stack = '' }) {
    const res = await fetch(`${this.baseUrl}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        language,
        industry,
        company_size_tag,
        budget,
        timeline_weeks,
        tech_stack,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Compile AI Full Pipeline Error [${res.status}]: ${errText}`);
    }
    return await res.json();
  },

  async nlpAnalyze(text) {
    const res = await fetch(`${this.baseUrl}/nlp/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Compile AI NLP Analyze Error [${res.status}]: ${errText}`);
    }
    return await res.json();
  },
};
