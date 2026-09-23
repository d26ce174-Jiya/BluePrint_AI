import { query } from '../connection.js';

export async function runMigration() {
  console.log('🔄 Running migration 002: Add credits and payments table...');
  try {
    await query('ALTER TABLE users ADD COLUMN credits INT NOT NULL DEFAULT 5');
    console.log('✅ Added credits column to users');
  } catch (err) {
    if (err.message && err.message.includes('Duplicate column')) {
      console.log('ℹ️ credits column already exists in users table.');
    } else {
      console.warn('⚠️ users column update notice:', err.message);
    }
  }

  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id CHAR(36) NOT NULL PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      order_id VARCHAR(100) NOT NULL UNIQUE,
      payment_id VARCHAR(100) NULL,
      signature VARCHAR(255) NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      coins INT NOT NULL DEFAULT 0,
      plan_id VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'created',
      gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_payments_user (user_id),
      INDEX idx_payments_order (order_id),
      CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ payments table initialized successfully in MySQL.');
}

if (process.argv[1] && process.argv[1].endsWith('002_add_credits_and_payments.js')) {
  runMigration().then(() => process.exit(0)).catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
}
