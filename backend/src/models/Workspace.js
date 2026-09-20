import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const WorkspaceModel = {
  async findById(id) {
    const rows = await query('SELECT * FROM workspaces WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findByOrgId(orgId) {
    const rows = await query('SELECT * FROM workspaces WHERE org_id = ? LIMIT 1', [orgId]);
    return rows[0] || null;
  },

  async findByUserId(userId) {
    const rows = await query(
      `SELECT w.* FROM workspaces w
       INNER JOIN users u ON u.workspace_id = w.id
       WHERE u.id = ?`,
      [userId]
    );
    return rows;
  },

  async create({ name, orgId = null }) {
    const id = uuidv4();
    await query(
      'INSERT INTO workspaces (id, org_id, name) VALUES (?, ?, ?)',
      [id, orgId, name]
    );
    return { id, orgId, name };
  },

  async updateName(id, name) {
    await query('UPDATE workspaces SET name = ? WHERE id = ?', [name, id]);
  }
};
