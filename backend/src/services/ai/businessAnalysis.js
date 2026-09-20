import { compileAiClient } from './compileAiClient.js';
import { inputAnalyzer } from './inputAnalyzer.js';
import { llmClient } from './llmClient.js';

export const businessAnalysis = {
  async generateBrd({ rawInput = '', context = {}, answeredQa = [] }) {
    const analysis = await inputAnalyzer.analyze(rawInput, context);
    const qaMap = {};
    for (const item of answeredQa || []) {
      if (item.question && item.answer) {
        qaMap[item.question] = item.answer;
      }
    }

    try {
      if (await compileAiClient.isHealthy()) {
        const sections = await compileAiClient.generate(rawInput, qaMap, 'brd');
        if (Array.isArray(sections) && sections.length > 0 && sections[0].content) {
          const content = sections[0].content;
          return {
            objectives: `Transform ${analysis.problemTitle} for ${analysis.industry}`,
            scope: content,
            stakeholdersList: analysis.stakeholders || ['CTO', 'Operations Lead'],
            gapAnalysis: [
              { area: 'Operational Bottlenecks', impact: 'High', gap: 'Manual steps vs automated digital workflow' },
              { area: 'Compliance & Auditability', impact: 'Medium', gap: 'Fragmented logs vs automated compliance audit trail' }
            ],
            functionalRequirements: [
              { id: 'FR-1.1', title: 'Automated Processing Engine', description: `Automate ${analysis.problemTitle} workflows`, priority: 'Must Have' },
              { id: 'FR-1.2', title: 'Data Ingestion & Integration', description: 'Connect existing legacy data sources and tools', priority: 'Must Have' },
              { id: 'FR-1.3', title: 'Stakeholder Reporting Dashboard', description: 'Provide live status views for key operational leads', priority: 'Must Have' }
            ],
            nonFunctionalRequirements: [
              { category: 'Availability', requirement: '99.5% uptime target' },
              { category: 'Security', requirement: 'TLS 1.3 in transit and AES-256 at rest' }
            ],
            assumptions: [
              `Target budget band: ${analysis.budgetBand}`,
              'Existing data sources accessible via API or file export'
            ],
            constraintsData: [
              `Target completion window in ${analysis.industry} domain`
            ],
            rawBrdDocument: content,
          };
        }
      }
    } catch (err) {
      console.warn('[BusinessAnalysis] Compile AI server BRD generation fallback:', err.message);
    }

    return {
      objectives: `Eliminate manual handling of ${analysis.problemTitle} in ${analysis.industry}`,
      scope: `In-Scope: Core automation of ${analysis.problemTitle}, integration with legacy spreadsheets/ERPs, stakeholder dashboards. Out-of-Scope: Bespoke legacy hardware changes.`,
      stakeholdersList: analysis.stakeholders || ['CTO', 'Operations Lead'],
      gapAnalysis: [
        { area: 'Operational Bottlenecks', impact: 'High', gap: 'Current manual steps cause delay. Desired state: Automated pipeline.' }
      ],
      functionalRequirements: [
        { id: 'FR-1.1', title: 'Data Ingestion', description: 'Capture and structure data into normalized schema', priority: 'Must Have' },
        { id: 'FR-1.2', title: 'Workflow Engine', description: 'Automate approval handoffs', priority: 'Must Have' }
      ],
      nonFunctionalRequirements: [
        { category: 'Availability', requirement: '99.5% uptime target' }
      ],
      assumptions: ['Legacy system data accessible'],
      constraintsData: ['Target launch within planned timeline']
    };
  }
};
