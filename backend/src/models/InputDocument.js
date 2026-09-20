import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const InputDocumentModel = {
  async findBySessionId(sessionId) {
    return query(
      'SELECT id, session_id, file_name, file_type, storage_url, created_at FROM input_documents WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );
  },

  async create({ sessionId, fileName = null, fileType = 'text', storageUrl = null, parsedText = '' }) {
    const id = uuidv4();
    await query(
      `INSERT INTO input_documents (id, session_id, file_name, file_type, storage_url, parsed_text)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, sessionId, fileName, fileType, storageUrl, parsedText]
    );
    return { id, sessionId, fileName, fileType, storageUrl };
  },

  async getAllParsedText(sessionId) {
    const docs = await query(
      'SELECT parsed_text FROM input_documents WHERE session_id = ?',
      [sessionId]
    );
    return docs.map(d => d.parsed_text).filter(Boolean).join('\n\n---\n\n');
  }
};
