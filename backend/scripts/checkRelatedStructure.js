const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRelatedStructure() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔍 Vérification de la structure des tables de référence...\n');

    // Vérifier airesantes
    console.log('📊 Structure de la table airesantes:');
    const [airesantesColumns] = await conn.execute(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'airesantes'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    airesantesColumns.forEach(col => console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`));

    // Vérifier arrondissements
    console.log('\n📊 Structure de la table arrondissements:');
    const [arrondColumns] = await conn.execute(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'arrondissements'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    arrondColumns.forEach(col => console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`));

    // Compter les enregistrements
    const [airesanteCount] = await conn.execute('SELECT COUNT(*) as total FROM airesantes');
    const [arrondCount] = await conn.execute('SELECT COUNT(*) as total FROM arrondissements');

    console.log(`\n📈 airesantes: ${airesanteCount[0].total} enregistrements`);
    console.log(`📈 arrondissements: ${arrondCount[0].total} enregistrements`);

    // Obtenir le premier ID de chaque table
    const [firstAiresante] = await conn.execute('SELECT id FROM airesantes ORDER BY id LIMIT 1');
    const [firstArrond] = await conn.execute('SELECT id FROM arrondissements ORDER BY id LIMIT 1');

    if (firstAiresante.length > 0) {
      console.log(`\n✅ Premier ID airesante: ${firstAiresante[0].id}`);
    }
    if (firstArrond.length > 0) {
      console.log(`✅ Premier ID arrondissement: ${firstArrond[0].id}`);
    }

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await conn.end();
  }
}

checkRelatedStructure();
