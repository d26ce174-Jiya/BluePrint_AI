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

export const SolutionArchitectureModel = {
  async findBySessionId(sessionId) {
    const rows = await query('SELECT * FROM solution_architectures WHERE session_id = ? ORDER BY version DESC LIMIT 1', [sessionId]);
    if (!rows || rows.length === 0) return null;
    const row = rows[0];

    return {
      ...row,
      tech_stack: safeParseJson(row.tech_stack, []),
      components: safeParseJson(row.components, []),
      bpmn_workflows: safeParseJson(row.bpmn_workflows, null),
      database_schema: safeParseJson(row.database_schema, null),
      api_specs: safeParseJson(row.api_specs, null),
      wireframes: safeParseJson(row.wireframes, null),
    };
  },

  async upsert({
    sessionId,
    hldSummary = '',
    techStack = [],
    components = [],
    dataFlow = '',
    securityNotes = '',
    bpmnWorkflows = null,
    databaseSchema = null,
    apiSpecs = null,
    wireframes = null,
    version = 1,
  }) {
    const existing = await this.findBySessionId(sessionId);
    const id = existing ? existing.id : uuidv4();
    const nextVersion = existing ? existing.version + 1 : version;

    const techStackJson = JSON.stringify(techStack || []);
    const componentsJson = JSON.stringify(components || []);
    const bpmnJson = bpmnWorkflows ? JSON.stringify(bpmnWorkflows) : null;
    const dbJson = databaseSchema ? JSON.stringify(databaseSchema) : null;
    const apiJson = apiSpecs ? JSON.stringify(apiSpecs) : null;
    const wireframesJson = wireframes ? JSON.stringify(wireframes) : null;

    if (existing) {
      await query(
        `UPDATE solution_architectures
         SET hld_summary = ?, tech_stack = ?, components = ?, data_flow = ?, security_notes = ?,
             bpmn_workflows = ?, database_schema = ?, api_specs = ?, wireframes = ?, version = ?
         WHERE id = ?`,
        [
          hldSummary,
          techStackJson,
          componentsJson,
          dataFlow,
          securityNotes,
          bpmnJson,
          dbJson,
          apiJson,
          wireframesJson,
          nextVersion,
          id,
        ]
      );
    } else {
      await query(
        `INSERT INTO solution_architectures 
         (id, session_id, hld_summary, tech_stack, components, data_flow, security_notes, bpmn_workflows, database_schema, api_specs, wireframes, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          sessionId,
          hldSummary,
          techStackJson,
          componentsJson,
          dataFlow,
          securityNotes,
          bpmnJson,
          dbJson,
          apiJson,
          wireframesJson,
          nextVersion,
        ]
      );
    }

    return this.findBySessionId(sessionId);
  }
};
