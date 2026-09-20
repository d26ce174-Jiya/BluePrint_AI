import { compileAiClient } from './compileAiClient.js';
import { inputAnalyzer } from './inputAnalyzer.js';

export const estimation = {
  async generateEstimate({ brd = {}, architecture = {}, rawInput = '', context = {} }) {
    const analysis = await inputAnalyzer.analyze(rawInput || brd.objectives || '', context);

    try {
      if (await compileAiClient.isHealthy()) {
        const sections = await compileAiClient.generate(rawInput || brd.objectives || '', {}, 'estimate');
        if (Array.isArray(sections) && sections.length > 0 && sections[0].content) {
          const content = sections[0].content;
          return {
            phaseBreakdown: [
              { phase: 'Discovery & Requirements', weeks: 2, percentage: 15 },
              { phase: 'Architecture & UX Design', weeks: 2, percentage: 15 },
              { phase: 'Core Build & API Integration', weeks: 8, percentage: 50 },
              { phase: 'Testing & Compliance QA', weeks: 2, percentage: 10 },
              { phase: 'Deployment & Pilot Launch', weeks: 2, percentage: 10 }
            ],
            costBand: `Estimated Cost Band: ${analysis.budgetBand || '$75K-$250K'}`,
            lowEstimateUsd: 45000,
            midEstimateUsd: 95000,
            highEstimateUsd: 180000,
            rawEstimateDetails: content,
            teamAssumptions: {
              teamComposition: '1 Lead Architect, 2 Full-Stack Engineers, 1 QA Engineer, 0.5 DevOps',
              deliveryModel: 'Agile 2-week sprint iterations',
              timelineWeeks: 16
            }
          };
        }
      }
    } catch (err) {
      console.warn('[Estimation] Compile AI server estimation generation fallback:', err.message);
    }

    return {
      phaseBreakdown: [
        { phase: 'Discovery & Requirements', weeks: 2, percentage: 15 },
        { phase: 'Architecture & Design', weeks: 2, percentage: 15 },
        { phase: 'Development & Build', weeks: 8, percentage: 50 },
        { phase: 'QA & Testing', weeks: 2, percentage: 10 },
        { phase: 'Deployment', weeks: 2, percentage: 10 }
      ],
      costBand: 'Mid: $95,000 ($45k - $180k)',
      lowEstimateUsd: 45000,
      midEstimateUsd: 95000,
      highEstimateUsd: 180000,
      teamAssumptions: {
        teamComposition: '1 Architect, 2 Software Engineers, 1 QA Lead',
        deliveryModel: 'Agile sprint delivery',
        timelineWeeks: 16
      }
    };
  }
};
