require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  console.log('Applying schema.sql ...');
  await pool.query(sql);
  console.log('\u2713 Database schema applied successfully.');
  await pool.end();
}

run().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
