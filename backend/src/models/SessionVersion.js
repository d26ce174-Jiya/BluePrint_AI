import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

function safeParseJson(val, fallback = {}) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

export const SessionVersionModel = {
  async findBySessionId(sessionId) {
    const rows = await query(
      'SELECT id, session_id, version_number, changed_section, snapshot_data, created_at FROM session_versions WHERE session_id = ? ORDER BY version_number DESC',
      [sessionId]
    );
    return rows.map(r => ({
      ...r,
      snapshot_data: safeParseJson(r.snapshot_data, {}),
    }));
  },

  async findById(id) {
    const rows = await query('SELECT * FROM session_versions WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return null;
    return {
      ...rows[0],
      snapshot_data: safeParseJson(rows[0].snapshot_data, {}),
    };
  },

  async create({ sessionId, changedSection = 'initial', snapshotData = {} }) {
    const id = uuidv4();
    const existing = await query(
      'SELECT MAX(version_number) as max_v FROM session_versions WHERE session_id = ?',
      [sessionId]
    );
    const nextVersion = (existing[0]?.max_v || 0) + 1;

    await query(
      `INSERT INTO session_versions (id, session_id, version_number, changed_section, snapshot_data)
       VALUES (?, ?, ?, ?, ?)`,
      [id, sessionId, nextVersion, changedSection, JSON.stringify(snapshotData)]
    );

    return { id, sessionId, versionNumber: nextVersion, changedSection };
  }
};
