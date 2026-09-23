import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

export const PaymentModel = {
  async create({ userId, orderId, amount, currency = 'INR', coins = 0, planId = 'starter', gateway = 'razorpay' }) {
    const id = uuidv4();
    await query(
      `INSERT INTO payments (id, user_id, order_id, amount, currency, coins, plan_id, status, gateway)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'created', ?)`,
      [id, userId, orderId, amount, currency, coins, planId, gateway]
    );
    return this.findById(id);
  },

  async findById(id) {
    const rows = await query('SELECT * FROM payments WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findByOrderId(orderId) {
    const rows = await query('SELECT * FROM payments WHERE order_id = ? LIMIT 1', [orderId]);
    return rows[0] || null;
  },

  async markSuccess({ orderId, paymentId, signature }) {
    await query(
      `UPDATE payments 
       SET status = 'success', payment_id = ?, signature = ?, updated_at = CURRENT_TIMESTAMP
       WHERE order_id = ?`,
      [paymentId, signature, orderId]
    );
    return this.findByOrderId(orderId);
  },

  async markFailed({ orderId, reason = '' }) {
    await query(
      `UPDATE payments 
       SET status = 'failed', updated_at = CURRENT_TIMESTAMP
       WHERE order_id = ?`,
      [orderId]
    );
    return this.findByOrderId(orderId);
  },

  async listByUserId(userId) {
    return query(
      `SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
  }
};
