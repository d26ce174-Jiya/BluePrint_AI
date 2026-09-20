import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const OrganizationModel = {
  async findById(id) {
    const rows = await query('SELECT * FROM organizations WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findByName(name) {
    const rows = await query('SELECT * FROM organizations WHERE LOWER(name) = LOWER(?) LIMIT 1', [name]);
    return rows[0] || null;
  },

  async create({ name }) {
    const id = uuidv4();
    await query(
      'INSERT INTO organizations (id, name) VALUES (?, ?)',
      [id, name]
    );
    return { id, name };
  }
};
