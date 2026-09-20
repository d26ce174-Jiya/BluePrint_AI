import { compileAiClient } from './compileAiClient.js';
import { inputAnalyzer } from './inputAnalyzer.js';

export const discoveryEngine = {
  async generateQuestions(inputContent = '', existingContext = {}) {
    try {
      if (await compileAiClient.isHealthy()) {
        const res = await compileAiClient.discover(inputContent);
        if (res && res.questions && Array.isArray(res.questions) && res.questions.length > 0) {
          return res.questions.slice(0, 7);
        }
      }
    } catch (err) {
      console.warn('[DiscoveryEngine] Compile AI server call failed, falling back to NLP analyzer:', err.message);
    }

    const analysis = await inputAnalyzer.analyze(inputContent, existingContext);
    return [
      `What key stakeholders and user roles will interact with this system daily?`,
      `Are there specific compliance or security regulations required for your industry (${analysis.classification?.industry || 'General'})?`,
      `What legacy databases, CRMs, or ERPs must this solution integrate with?`,
      `What is the target timeline and budget band for this transformation initiative?`,
      `What volume of data or active users do you expect at peak load?`,
    ];
  },
};
