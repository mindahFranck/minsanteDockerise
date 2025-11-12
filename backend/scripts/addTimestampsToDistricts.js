require('dotenv').config();
const mysql = require('mysql2/promise');

async function addTimestampsToDistricts() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Connected to database\n');

  try {
    console.log('=== Adding timestamp columns to districts table ===\n');

    // Ajouter created_at
    await conn.execute(`
      ALTER TABLE districts
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✓ Added created_at column');

    // Ajouter updated_at
    await conn.execute(`
      ALTER TABLE districts
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
    console.log('✓ Added updated_at column');

    console.log('\n✅ Timestamp columns added successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await conn.end();
    console.log('\nConnection closed');
  }
}

addTimestampsToDistricts();
