require('dotenv').config();
const mysql = require('mysql2/promise');

async function addMissingColumns() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Connected to database\n');

  try {
    console.log('=== Ajout des colonnes manquantes ===\n');

    // 1. Ajouter 'capitale' à regions
    try {
      await conn.execute(`
        ALTER TABLE regions
        ADD COLUMN capitale VARCHAR(191) NULL AFTER nom
      `);
      console.log('✓ Colonne "capitale" ajoutée à la table "regions"');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ Colonne "capitale" existe déjà dans "regions"');
      } else {
        throw error;
      }
    }

    // 2. Ajouter 'nom' à batiments
    try {
      await conn.execute(`
        ALTER TABLE batiments
        ADD COLUMN nom VARCHAR(200) NULL AFTER id
      `);
      console.log('✓ Colonne "nom" ajoutée à la table "batiments"');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ Colonne "nom" existe déjà dans "batiments"');
      } else {
        throw error;
      }
    }

    // 3. Ajouter 'nom' à equipements
    try {
      await conn.execute(`
        ALTER TABLE equipements
        ADD COLUMN nom VARCHAR(200) NULL AFTER id
      `);
      console.log('✓ Colonne "nom" ajoutée à la table "equipements"');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ Colonne "nom" existe déjà dans "equipements"');
      } else {
        throw error;
      }
    }

    console.log('\n=== Vérification des colonnes ===\n');

    // Vérifier regions
    const [regionsColumns] = await conn.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'regions' AND COLUMN_NAME = 'capitale'
    `);
    console.log('Régions - capitale:', regionsColumns.length > 0 ? '✓ Existe' : '✗ Manquante');

    // Vérifier batiments
    const [batimentsColumns] = await conn.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'batiments' AND COLUMN_NAME = 'nom'
    `);
    console.log('Batiments - nom:', batimentsColumns.length > 0 ? '✓ Existe' : '✗ Manquante');

    // Vérifier equipements
    const [equipementsColumns] = await conn.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'equipements' AND COLUMN_NAME = 'nom'
    `);
    console.log('Equipements - nom:', equipementsColumns.length > 0 ? '✓ Existe' : '✗ Manquante');

    console.log('\n✅ Toutes les colonnes ont été ajoutées avec succès!\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    await conn.end();
    console.log('Connexion fermée');
  }
}

addMissingColumns();
