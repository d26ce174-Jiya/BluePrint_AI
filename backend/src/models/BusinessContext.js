import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const BusinessContextModel = {
  async findBySessionId(sessionId) {
    const rows = await query('SELECT * FROM business_contexts WHERE session_id = ? LIMIT 1', [sessionId]);
    return rows[0] || null;
  },

  async upsert({ sessionId, goals = null, constraintsText = null, stakeholders = null, existingSystems = null, rawSummary = null }) {
    const existing = await this.findBySessionId(sessionId);
    if (existing) {
      await query(
        `UPDATE business_contexts
         SET goals = COALESCE(?, goals),
             constraints_text = COALESCE(?, constraints_text),
             stakeholders = COALESCE(?, stakeholders),
             existing_systems = COALESCE(?, existing_systems),
             raw_summary = COALESCE(?, raw_summary)
         WHERE session_id = ?`,
        [goals, constraintsText, stakeholders, existingSystems, rawSummary, sessionId]
      );
      return this.findBySessionId(sessionId);
    } else {
      const id = uuidv4();
      await query(
        `INSERT INTO business_contexts (id, session_id, goals, constraints_text, stakeholders, existing_systems, raw_summary)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, sessionId, goals, constraintsText, stakeholders, existingSystems, rawSummary]
      );
      return { id, sessionId, goals, constraintsText, stakeholders, existingSystems, rawSummary };
    }
  }
};
