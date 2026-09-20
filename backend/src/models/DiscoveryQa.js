import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const DiscoveryQaModel = {
  async findBySessionId(sessionId) {
    return query(
      'SELECT * FROM discovery_qas WHERE session_id = ? ORDER BY order_index ASC, created_at ASC',
      [sessionId]
    );
  },

  async create({ sessionId, question, orderIndex = 0 }) {
    const id = uuidv4();
    await query(
      `INSERT INTO discovery_qas (id, session_id, question, order_index, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [id, sessionId, question, orderIndex]
    );
    return { id, sessionId, question, orderIndex, status: 'pending' };
  },

  async answer(id, answer) {
    await query(
      `UPDATE discovery_qas
       SET answer = ?, status = 'answered', answered_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [answer, id]
    );
  },

  async skip(id) {
    await query(
      `UPDATE discovery_qas SET status = 'skipped' WHERE id = ?`,
      [id]
    );
  },

  async bulkCreate(sessionId, questions = []) {
    const created = [];
    for (let i = 0; i < questions.length; i++) {
      const q = await this.create({ sessionId, question: questions[i], orderIndex: i });
      created.push(q);
    }
    return created;
  }
};
