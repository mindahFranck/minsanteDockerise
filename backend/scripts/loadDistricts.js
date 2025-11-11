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

  console.log('Connected to database');

  // Désactiver les vérifications de clés étrangères
  console.log('Disabling foreign key checks...');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

  // Vider la table d'abord si elle existe
  console.log('Truncating districts table...');
  await conn.execute('DROP TABLE IF EXISTS districts');

  // Lire le fichier SQL
  console.log('Reading SQL file...');
  const sqlFile = fs.readFileSync(path.join(__dirname, 'district.sql'), 'utf8');

  // Remplacer `district` par `districts`
  console.log('Processing SQL...');
  const modifiedSql = sqlFile.replace(/INSERT INTO `district`/g, 'INSERT INTO `districts`').replace(/CREATE TABLE `district`/g, 'CREATE TABLE IF NOT EXISTS `districts`');

  // Exécuter le SQL
  console.log('Executing SQL...');
  await conn.query(modifiedSql);

  console.log('Districts loaded successfully!');

  // Réactiver les vérifications de clés étrangères
  console.log('Re-enabling foreign key checks...');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

  // Vérifier le nombre de districts insérés
  const [rows] = await conn.execute('SELECT COUNT(*) as count FROM districts');
  console.log(`Total districts: ${rows[0].count}`);

  await conn.end();
}

loadDistricts().catch(err => {
  console.error('Error loading districts:', err);
  process.exit(1);
});
