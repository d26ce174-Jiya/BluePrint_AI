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

export const BrdModel = {
  async findBySessionId(sessionId) {
    const rows = await query('SELECT * FROM brds WHERE session_id = ? ORDER BY version DESC LIMIT 1', [sessionId]);
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    return {
      ...row,
      stakeholders_list: safeParseJson(row.stakeholders_list, []),
      gap_analysis: safeParseJson(row.gap_analysis, []),
      functional_requirements: safeParseJson(row.functional_requirements, []),
      non_functional_requirements: safeParseJson(row.non_functional_requirements, []),
      assumptions: safeParseJson(row.assumptions, []),
      constraints_data: safeParseJson(row.constraints_data, []),
    };
  },

  async upsert({
    sessionId,
    objectives = '',
    scope = '',
    stakeholdersList = [],
    gapAnalysis = [],
    functionalRequirements = [],
    nonFunctionalRequirements = [],
    assumptions = [],
    constraintsData = [],
    version = 1,
  }) {
    const existing = await this.findBySessionId(sessionId);
    const id = existing ? existing.id : uuidv4();
    const nextVersion = existing ? existing.version + 1 : version;

    const stakeholdersJson = JSON.stringify(stakeholdersList || []);
    const gapAnalysisJson = JSON.stringify(gapAnalysis || []);
    const funcReqsJson = JSON.stringify(functionalRequirements || []);
    const nonFuncReqsJson = JSON.stringify(nonFunctionalRequirements || []);
    const assumptionsJson = JSON.stringify(assumptions || []);
    const constraintsJson = JSON.stringify(constraintsData || []);

    if (existing) {
      await query(
        `UPDATE brds
         SET objectives = ?, scope = ?, stakeholders_list = ?, gap_analysis = ?,
             functional_requirements = ?, non_functional_requirements = ?,
             assumptions = ?, constraints_data = ?, version = ?
         WHERE id = ?`,
        [
          objectives,
          scope,
          stakeholdersJson,
          gapAnalysisJson,
          funcReqsJson,
          nonFuncReqsJson,
          assumptionsJson,
          constraintsJson,
          nextVersion,
          id,
        ]
      );
    } else {
      await query(
        `INSERT INTO brds (id, session_id, objectives, scope, stakeholders_list, gap_analysis, functional_requirements, non_functional_requirements, assumptions, constraints_data, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          sessionId,
          objectives,
          scope,
          stakeholdersJson,
          gapAnalysisJson,
          funcReqsJson,
          nonFuncReqsJson,
          assumptionsJson,
          constraintsJson,
          nextVersion,
        ]
      );
    }

    return this.findBySessionId(sessionId);
  }
};
