import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('🚀 Initializing MySQL database for Compile...');
  
  // 1. Connect without database selected to create database if not exists
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    console.log(`📦 Creating database '${env.DB_NAME}' if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${env.DB_NAME}\`;`);

    // 2. Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    const sqlFile = fs.readFileSync(migrationPath, 'utf8');

    // Remove comments and split by semicolon
    const cleaned = sqlFile
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleaned
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📜 Executing ${statements.length} schema migration statements...`);
    for (const stmt of statements) {
      await connection.query(stmt);
    }

    console.log('✅ MySQL Database and all 12 tables created successfully!');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDatabase();
