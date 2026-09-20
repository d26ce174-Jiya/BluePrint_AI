import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const SessionModel = {
  async findById(id) {
    const rows = await query('SELECT * FROM sessions WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findByWorkspaceId(workspaceId) {
    const rows = await query(
      `SELECT 
        s.id, 
        s.workspace_id, 
        s.user_id, 
        s.title, 
        s.status, 
        s.created_at, 
        s.updated_at,
        COALESCE(
          (SELECT objectives FROM brds WHERE session_id = s.id ORDER BY version DESC LIMIT 1),
          (SELECT SUBSTRING(parsed_text, 1, 140) FROM input_documents WHERE session_id = s.id ORDER BY created_at ASC LIMIT 1),
          'Fresh blueprint session initialized.'
        ) as summary,
        (SELECT COUNT(*) FROM discovery_qas WHERE session_id = s.id) as total_questions,
        (SELECT COUNT(*) FROM discovery_qas WHERE session_id = s.id AND answer IS NOT NULL) as answered_questions,
        (SELECT mid_estimate_usd FROM effort_estimates WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) as mid_estimate_usd,
        (SELECT version_number FROM session_versions WHERE session_id = s.id ORDER BY version_number DESC LIMIT 1) as latest_version
      FROM sessions s
      WHERE s.workspace_id = ?
      ORDER BY s.created_at DESC`,
      [workspaceId]
    );

    return rows.map(r => {
      const tags = [];
      if (r.status === 'completed') {
        tags.push('BRD Ready');
        tags.push('HLD Generated');
        if (r.mid_estimate_usd) {
          tags.push(`Est: $${Math.round(r.mid_estimate_usd / 1000)}k`);
        }
      } else if (r.status === 'discovery') {
        const total = r.total_questions || 5;
        const answered = r.answered_questions || 0;
        tags.push(`${answered}/${total} Questions Answered`);
        tags.push('Discovery Q&A');
      } else if (r.status === 'generating') {
        tags.push('Reasoning in Progress');
      } else {
        tags.push('Draft Intake');
      }

      return {
        ...r,
        version: r.latest_version || 1,
        tags,
      };
    });
  },

  async create({ workspaceId = null, userId, title = 'New Transformation Blueprint' }) {
    const id = uuidv4();
    await query(
      `INSERT INTO sessions (id, workspace_id, user_id, title, status)
       VALUES (?, ?, ?, ?, 'intake')`,
      [id, workspaceId, userId, title]
    );
    return { id, workspaceId, userId, title, status: 'intake' };
  },

  async updateStatus(id, status) {
    await query('UPDATE sessions SET status = ? WHERE id = ?', [status, id]);
  },

  async updateTitle(id, title) {
    await query('UPDATE sessions SET title = ? WHERE id = ?', [title, id]);
  },

  async delete(id) {
    await query('DELETE FROM sessions WHERE id = ?', [id]);
  }
};
