import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

function safeParseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

export const EffortEstimateModel = {
  async findBySessionId(sessionId) {
    const rows = await query('SELECT * FROM effort_estimates WHERE session_id = ? ORDER BY created_at DESC LIMIT 1', [sessionId]);
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    return {
      ...row,
      phase_breakdown: safeParseJson(row.phase_breakdown, []),
      team_assumptions: safeParseJson(row.team_assumptions, {}),
    };
  },

  async upsert({
    sessionId,
    phaseBreakdown = [],
    costBand = 'Mid: $45k',
    lowEstimateUsd = 28000,
    midEstimateUsd = 45000,
    highEstimateUsd = 68000,
    teamAssumptions = {},
  }) {
    const existing = await this.findBySessionId(sessionId);
    const id = existing ? existing.id : uuidv4();

    const phaseJson = JSON.stringify(phaseBreakdown || []);
    const teamJson = JSON.stringify(teamAssumptions || {});

    if (existing) {
      await query(
        `UPDATE effort_estimates
         SET phase_breakdown = ?, cost_band = ?, low_estimate_usd = ?, mid_estimate_usd = ?, high_estimate_usd = ?, team_assumptions = ?
         WHERE id = ?`,
        [
          phaseJson,
          costBand,
          lowEstimateUsd,
          midEstimateUsd,
          highEstimateUsd,
          teamJson,
          id,
        ]
      );
    } else {
      await query(
        `INSERT INTO effort_estimates (id, session_id, phase_breakdown, cost_band, low_estimate_usd, mid_estimate_usd, high_estimate_usd, team_assumptions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          sessionId,
          phaseJson,
          costBand,
          lowEstimateUsd,
          midEstimateUsd,
          highEstimateUsd,
          teamJson,
        ]
      );
    }

    return this.findBySessionId(sessionId);
  }
};
