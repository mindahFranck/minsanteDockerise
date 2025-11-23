const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyFosaData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔍 Vérification des données FOSA...\n');

    // Compter les enregistrements
    const [count] = await conn.execute('SELECT COUNT(*) as total FROM fosas');
    console.log(`📊 Total d'enregistrements: ${count[0].total}\n`);

    // Vérifier les NULL pour chaque colonne
    const [columns] = await conn.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'fosas'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);

    console.log('🔎 Vérification des valeurs NULL par colonne:\n');

    let hasNulls = false;

    for (const col of columns) {
      const [nullCount] = await conn.execute(
        `SELECT COUNT(*) as count FROM fosas WHERE ${col.COLUMN_NAME} IS NULL`
      );

      if (nullCount[0].count > 0) {
        console.log(`❌ ${col.COLUMN_NAME}: ${nullCount[0].count} valeurs NULL`);
        hasNulls = true;
      } else {
        console.log(`✅ ${col.COLUMN_NAME}: Pas de NULL`);
      }
    }

    if (!hasNulls) {
      console.log('\n✨ Aucune valeur NULL trouvée! Toutes les données sont complètes.');
    } else {
      console.log('\n⚠️  Certaines colonnes contiennent des valeurs NULL.');
    }

    // Afficher quelques exemples
    console.log('\n📋 Aperçu des 3 premiers enregistrements:');
    const [samples] = await conn.execute('SELECT * FROM fosas LIMIT 3');
    samples.forEach((row, index) => {
      console.log(`\n--- Enregistrement ${index + 1} ---`);
      for (const [key, value] of Object.entries(row)) {
        console.log(`  ${key}: ${value === null ? 'NULL' : value}`);
      }
    });

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await conn.end();
  }
}

verifyFosaData();
