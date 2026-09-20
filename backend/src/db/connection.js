import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      multipleStatements: true,
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  const connection = getPool();
  try {
    const [rows, fields] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('MySQL Query Error:', error.message, '\nSQL:', sql);
    throw error;
  }
}

export async function testConnection() {
  try {
    const connection = getPool();
    const [rows] = await connection.query('SELECT 1 + 1 AS solution');
    console.log('✅ MySQL Database connected successfully:', env.DB_NAME, `on ${env.DB_HOST}:${env.DB_PORT}`);
    return true;
  } catch (err) {
    console.warn('⚠️  MySQL Connection warning:', err.message);
    console.warn('💡 Ensure MySQL is running or configure credentials in .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)');
    return false;
  }
}

export default { getPool, query, testConnection };
