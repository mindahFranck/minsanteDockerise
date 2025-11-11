require('dotenv').config();
const mysql = require('mysql2/promise');

async function addMaterielroulantFields() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Connected to database\n');

  try {
    console.log('=== Adding fields to materielroulants table ===\n');

    // Add date_mise_en_circulation and etat
    await conn.execute(`
      ALTER TABLE materielroulants
      ADD COLUMN IF NOT EXISTS date_mise_en_circulation DATE NULL,
      ADD COLUMN IF NOT EXISTS etat VARCHAR(50) NULL
    `);
    console.log('✓ Added date_mise_en_circulation and etat fields');

    console.log('\n✅ Fields added successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await conn.end();
    console.log('\nConnection closed');
  }
}

addMaterielroulantFields();
