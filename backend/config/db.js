import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool;

const connectDB = async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('MySQL connected.');

    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let statement of statements) {
      try {
        await conn.query(statement);
      } catch (stmtErr) {
        // Ignore "duplicate column" or similar non-fatal schema errors
        if (!stmtErr.message.includes('Duplicate column') && !stmtErr.message.includes('already exists')) {
          console.warn('Schema warning (non-fatal):', stmtErr.message);
        }
      }
    }
    await conn.end();
    console.log('MySQL Database & Tables initialized successfully.');

    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'edu_od',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  } catch (error) {
    console.error('MySQL Setup Error:', error.message);
    // Only exit if we can't connect at all (pool creation failed)
    if (!pool) {
      process.exit(1);
    }
  }
};

export const query = async (sql, params) => {
  if (!pool) {
    throw new Error('Database pool has not been initialized.');
  }
  const [results] = await pool.execute(sql, params);
  return results;
};

export default connectDB;
