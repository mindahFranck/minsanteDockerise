require('dotenv').config();
const mysql = require('mysql2/promise');

async function addFosaIdToServices() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Connected to database\n');

  try {
    console.log('=== Adding fosa_id to services table ===\n');

    // Add fosa_id column
    await conn.execute(`
      ALTER TABLE services
      ADD COLUMN IF NOT EXISTS fosa_id INT NULL AFTER batiment_id,
      ADD CONSTRAINT services_fosa_fk FOREIGN KEY (fosa_id) REFERENCES fosas(id) ON DELETE CASCADE ON UPDATE CASCADE
    `);
    console.log('✓ Added fosa_id column to services');

    console.log('\n✅ Field added successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await conn.end();
    console.log('\nConnection closed');
  }
}

addFosaIdToServices();
