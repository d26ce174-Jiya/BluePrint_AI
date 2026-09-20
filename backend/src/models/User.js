import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export const UserModel = {
  async findByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const rows = await query(
      `SELECT u.id, u.workspace_id, u.name, u.email, u.role, u.onboarding_completed, u.created_at,
              w.name as workspace_name, o.name as company
       FROM users u
       LEFT JOIN workspaces w ON u.workspace_id = w.id
       LEFT JOIN organizations o ON w.org_id = o.id
       WHERE u.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async hasOwner(workspaceId) {
    if (!workspaceId) return false;
    const rows = await query(
      "SELECT id FROM users WHERE workspace_id = ? AND role = 'owner' LIMIT 1",
      [workspaceId]
    );
    return rows.length > 0;
  },

  async findOwnerByWorkspace(workspaceId) {
    if (!workspaceId) return null;
    const rows = await query(
      "SELECT id, name, email, role FROM users WHERE workspace_id = ? AND role = 'owner' LIMIT 1",
      [workspaceId]
    );
    return rows[0] || null;
  },

  /**
   * Cryptographic Password Hashing using bcrypt (Eksblowfish cipher):
   * - Salt factor: 12 (4,096 iterations of key stretching)
   * - 128-bit cryptographically secure pseudorandom salt per user
   * - Resistant against GPU/ASIC rainbow tables and offline brute-force attacks
   */
  async hashPassword(plainPassword) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(plainPassword, salt);
  },

  async create({ name, email, password, workspaceId = null, role = 'member' }) {
    const id = uuidv4();
    const passwordHash = await this.hashPassword(password);

    await query(
      `INSERT INTO users (id, workspace_id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, workspaceId, name, email, passwordHash, role]
    );

    return { id, workspaceId, name, email, role };
  },

  async comparePassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  },

  async updateProfile(userId, { name }) {
    if (name) {
      await query('UPDATE users SET name = ? WHERE id = ?', [name, userId]);
    }
    return this.findById(userId);
  },

  async updatePassword(userId, newPassword) {
    const passwordHash = await this.hashPassword(newPassword);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  },

  async updateWorkspace(userId, workspaceId) {
    await query('UPDATE users SET workspace_id = ? WHERE id = ?', [workspaceId, userId]);
  },

  async setOnboardingCompleted(userId, completed = true) {
    await query('UPDATE users SET onboarding_completed = ? WHERE id = ?', [completed ? 1 : 0, userId]);
    return this.findById(userId);
  }
};
