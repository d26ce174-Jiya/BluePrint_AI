import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const SessionMessageModel = {
  async findBySessionId(sessionId) {
    return query(
      'SELECT id, session_id, sender, message_text, created_at FROM session_messages WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );
  },

  async create({ sessionId, sender = 'user', messageText }) {
    const id = uuidv4();
    await query(
      `INSERT INTO session_messages (id, session_id, sender, message_text)
       VALUES (?, ?, ?, ?)`,
      [id, sessionId, sender, messageText]
    );
    return { id, sessionId, sender, messageText, createdAt: new Date() };
  },

  async clearSessionMessages(sessionId) {
    await query('DELETE FROM session_messages WHERE session_id = ?', [sessionId]);
  }
};
