import { compileAiClient } from './compileAiClient.js';

// ─── Regex helpers to extract numbers from Gemini's structured markdown ────

function extractWeeks(text, phaseName) {
  // Match table rows like: | Phase Name | 4 | 25% |
  const escaped = phaseName.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&');
  const tableRow = new RegExp(`\\|[^|]*${escaped}[^|]*\\|\\s*(\\d+)`, 'i');
  const m = text.match(tableRow);
  if (m) return parseInt(m[1], 10);

  // Match inline "Phase Name: N weeks" or "Phase Name — N weeks"
  const inline = new RegExp(`${escaped}[^\\n]{0,30}?(\\d+)\\s*weeks?`, 'i');
  const m2 = text.match(inline);
  if (m2) return parseInt(m2[1], 10);

  return null;
}

function extractUSD(text, label) {
  // Match "$75,000" or "$75k" or "75,000" near a label like "Low", "Mid", "High"
  const escaped = label.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&');
  const pattern = new RegExp(`${escaped}[^\\n$]{0,50}\\$([\\d,]+(?:\\.\\d+)?(?:k|K)?)`, 'i');
  const m = text.match(pattern);
  if (!m) return null;

  const raw = m[1].replace(/,/g, '');
  if (raw.toLowerCase().endsWith('k')) {
    return Math.round(parseFloat(raw) * 1000);
  }
  return parseInt(raw, 10) || null;
}

function extractTotalWeeks(text) {
  const m = text.match(/\*\*Total Timeline\*\*[:\s–-]*(\d+)\s*weeks?/i)
    || text.match(/total[:\s]*(\d+)\s*weeks?/i);
  return m ? parseInt(m[1], 10) : null;
}

function buildPhaseBreakdown(text, totalWeeks) {
  const phaseNames = [
    { key: 'Discovery', label: 'Discovery & Requirements', pattern: 'Discovery' },
    { key: 'Architecture', label: 'Architecture & UX Design', pattern: 'Architecture' },
    { key: 'Build', label: 'Core Build & Integration', pattern: 'Build|Development|Engineering' },
    { key: 'Testing', label: 'Testing, QA & Compliance', pattern: 'Testing|QA' },
    { key: 'Deployment', label: 'Deployment & Pilot Launch', pattern: 'Deployment|Launch' },
  ];

  const breakdown = [];
  let extractedWeeks = 0;

  for (const phase of phaseNames) {
    const weeks = extractWeeks(text, phase.pattern) || null;
    if (weeks) extractedWeeks += weeks;
    breakdown.push({ phase: phase.label, weeks: weeks || 0, percentage: 0 });
  }

  // Calculate real percentages
  const total = extractedWeeks || totalWeeks || 16;
  for (const item of breakdown) {
    item.percentage = item.weeks > 0
      ? Math.round((item.weeks / total) * 100)
      : 0;
  }

  // If we extracted nothing meaningful, return null so caller can use fallback
  if (extractedWeeks === 0) return null;
  return breakdown;
}

function extractTeamComposition(text) {
  const m = text.match(/Team composition[^:]*:\s*([^\n]+)/i)
    || text.match(/(\d+\s+(?:Lead|Senior|Full-Stack|Backend|Frontend|QA|DevOps)[^\n,]+(?:,\s*[^\n,]+)*)/i);
  return m ? m[1].trim() : null;
}

function extractDeliveryModel(text) {
  const m = text.match(/Delivery model[^:]*:\s*([^\n]+)/i)
    || text.match(/(Agile|Scrum|Kanban|Fixed-scope|Waterfall)[^\n]*/i);
  return m ? m[1].trim() : null;
}

// ─── Main estimation service ────────────────────────────────────────────────

export const estimation = {
  async generateEstimate({ brd = {}, architecture = {}, rawInput = '', context = {}, discoveryAnswers = {} }) {

    const inputText = rawInput || brd.objectives || '';

    // Pass discovery answers to give the AI richer context for estimation
    const enrichedAnswers = { ...discoveryAnswers };

    let aiContent = null;

    try {
      if (await compileAiClient.isHealthy()) {
        const sections = await compileAiClient.generate(inputText, enrichedAnswers, 'estimate');
        if (Array.isArray(sections) && sections.length > 0 && sections[0]?.content) {
          aiContent = sections[0].content;
        }
      }
    } catch (err) {
      console.warn('[Estimation] Compile AI call failed, using structured fallback:', err.message);
    }

    if (aiContent) {
      // ── Parse AI response for real numbers ──────────────────────────────
      const totalWeeks = extractTotalWeeks(aiContent);
      const phaseBreakdown = buildPhaseBreakdown(aiContent, totalWeeks);

      const lowUsd  = extractUSD(aiContent, 'Low|MVP|Minimum');
      const midUsd  = extractUSD(aiContent, 'Mid|Recommended|Baseline');
      const highUsd = extractUSD(aiContent, 'High|Enterprise');

      const teamComposition = extractTeamComposition(aiContent);
      const deliveryModel   = extractDeliveryModel(aiContent);

      // Only use AI numbers if we parsed something meaningful
      if (phaseBreakdown && (lowUsd || midUsd || highUsd)) {
        const resolvedLow  = lowUsd  || Math.round((midUsd || 95000) * 0.5);
        const resolvedMid  = midUsd  || Math.round((lowUsd || 45000) * 2);
        const resolvedHigh = highUsd || Math.round((midUsd || 95000) * 2);

        console.log(`[Estimation] AI-derived: Low=$${resolvedLow.toLocaleString()}, Mid=$${resolvedMid.toLocaleString()}, High=$${resolvedHigh.toLocaleString()}, Weeks=${totalWeeks}`);

        return {
          phaseBreakdown,
          costBand: `Low: $${resolvedLow.toLocaleString()} | Mid: $${resolvedMid.toLocaleString()} | High: $${resolvedHigh.toLocaleString()}`,
          lowEstimateUsd:  resolvedLow,
          midEstimateUsd:  resolvedMid,
          highEstimateUsd: resolvedHigh,
          rawEstimateDetails: aiContent,
          teamAssumptions: {
            teamComposition: teamComposition || 'Roles derived from requirement analysis',
            deliveryModel: deliveryModel || 'Agile 2-week sprint iterations',
            timelineWeeks: totalWeeks || phaseBreakdown.reduce((s, p) => s + p.weeks, 0),
          },
        };
      }

      // AI responded but parsing found no numbers — still return the raw content
      // so the markdown is shown to the user, even with fallback card values
      console.warn('[Estimation] AI responded but number extraction failed. Using fallback values with AI text.');
      return buildFallback(aiContent, context);
    }

    // No AI response at all — return structured fallback
    console.warn('[Estimation] No AI content available. Using static fallback.');
    return buildFallback(null, context);
  }
};

// ─── Structured fallback (only used when AI is unavailable or parsing fails) ─

function buildFallback(aiContent, context = {}) {
  return {
    phaseBreakdown: [
      { phase: 'Discovery & Requirements', weeks: 2, percentage: 13 },
      { phase: 'Architecture & UX Design', weeks: 3, percentage: 19 },
      { phase: 'Core Build & Integration', weeks: 7, percentage: 44 },
      { phase: 'Testing, QA & Compliance', weeks: 2, percentage: 13 },
      { phase: 'Deployment & Pilot Launch', weeks: 2, percentage: 13 },
    ],
    costBand: 'Estimated — regenerate for requirement-specific figures',
    lowEstimateUsd:  35000,
    midEstimateUsd:  85000,
    highEstimateUsd: 165000,
    rawEstimateDetails: aiContent || null,
    teamAssumptions: {
      teamComposition: '1 Lead Architect, 2 Full-Stack Engineers, 1 QA Engineer, 0.5 DevOps',
      deliveryModel: 'Agile 2-week sprint iterations',
      timelineWeeks: 16,
    },
  };
}
