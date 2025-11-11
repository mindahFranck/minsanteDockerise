require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function loadAiresantes() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  console.log('Connected to database');

  try {
    // Désactiver les vérifications de clés étrangères
    console.log('Disabling foreign key checks...');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Vider la table
    console.log('Truncating airesantes table...');
    await conn.execute('TRUNCATE TABLE airesantes');

    // Démarrer une transaction explicite
    console.log('Starting transaction...');
    await conn.beginTransaction();

    // Lire le fichier SQL
    console.log('Reading SQL file...');
    const sqlFile = fs.readFileSync(path.join(__dirname, 'airesantes.sql'), 'utf8');

    // Remplacer `aire` par `airesantes` et retirer START TRANSACTION
    console.log('Processing SQL...');
    let modifiedSql = sqlFile.replace(/INSERT INTO `aire`/g, 'INSERT INTO `airesantes`');
    // Retirer START TRANSACTION et COMMIT car on gère la transaction nous-mêmes
    modifiedSql = modifiedSql.replace(/START TRANSACTION;/g, '').replace(/COMMIT;/g, '');

    // Exécuter le SQL
    console.log('Executing SQL...');
    await conn.query(modifiedSql);

    // Committer explicitement la transaction
    console.log('Committing transaction...');
    await conn.commit();
  } catch (error) {
    // En cas d'erreur, rollback
    console.log('Error occurred, rolling back...');
    await conn.rollback();
    throw error;
  }

  console.log('Aires de santé loaded successfully!');

  // Réactiver les vérifications de clés étrangères
  console.log('Re-enabling foreign key checks...');
  await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

  // Vérifier le nombre d'aires de santé insérées
  const [rows] = await conn.execute('SELECT COUNT(*) as count FROM airesantes');
  console.log(`Total aires de santé: ${rows[0].count}`);

  await conn.end();
}

loadAiresantes().catch(err => {
  console.error('Error loading airesantes:', err);
  process.exit(1);
});
