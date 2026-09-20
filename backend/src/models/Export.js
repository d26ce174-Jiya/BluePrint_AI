import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const ExportModel = {
  async findBySessionId(sessionId) {
    return query(
      'SELECT * FROM exports WHERE session_id = ? ORDER BY created_at DESC',
      [sessionId]
    );
  },

  async create({ sessionId, format = 'pdf', fileUrl, fileSizeBytes = 0 }) {
    const id = uuidv4();
    await query(
      `INSERT INTO exports (id, session_id, format, file_url, file_size_bytes)
       VALUES (?, ?, ?, ?, ?)`,
      [id, sessionId, format, fileUrl, fileSizeBytes]
    );
    return { id, sessionId, format, fileUrl, fileSizeBytes };
  }
};
