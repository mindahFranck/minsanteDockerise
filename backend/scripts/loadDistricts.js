require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function loadDistricts() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  console.log('Connected to database\n');

  try {
    console.log('Disabling foreign key checks...');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    console.log('Truncating districts table...');
    await conn.execute('TRUNCATE TABLE districts');

    console.log('Reading SQL file...');
    const sqlFile = fs.readFileSync(path.join(__dirname, 'district.sql'), 'utf8');

    console.log('Processing SQL...');
    // Remplacer le nom de table 'district' par 'districts'
    let modifiedSql = sqlFile.replace(/INSERT INTO `district`/g, 'INSERT INTO `districts`');

    // Retirer les commandes de transaction et autres commandes système
    modifiedSql = modifiedSql.replace(/START TRANSACTION;/g, '');
    modifiedSql = modifiedSql.replace(/COMMIT;/g, '');
    modifiedSql = modifiedSql.replace(/SET SQL_MODE.*?;/g, '');
    modifiedSql = modifiedSql.replace(/SET time_zone.*?;/g, '');
    modifiedSql = modifiedSql.replace(/\/\*!40101.*?\*\/;/g, '');

    console.log('Executing SQL...');

    // Utiliser une transaction explicite
    await conn.beginTransaction();
    await conn.query(modifiedSql);
    await conn.commit();

    console.log('Districts loaded successfully!');

    console.log('Re-enabling foreign key checks...');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Vérifier le nombre de districts insérés
    const [rows] = await conn.execute('SELECT COUNT(*) as count FROM districts');
    console.log(`Total districts: ${rows[0].count}`);

  } catch (error) {
    console.error('Error:', error);
    await conn.rollback();
    throw error;
  } finally {
    await conn.end();
    console.log('\nConnection closed');
  }
}

loadDistricts().catch(err => {
  console.error('Error loading districts:', err);
  process.exit(1);
});
