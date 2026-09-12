require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If your DB requires SSL (Neon/Supabase), add the query param ?sslmode=require
  // to DATABASE_URL, or uncomment the next line:
  // ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
