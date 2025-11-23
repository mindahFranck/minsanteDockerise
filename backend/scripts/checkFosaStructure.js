const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkFosaStructure() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔍 Vérification de la structure de la table fosas...\n');

    const [columns] = await conn.execute(`
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'fosas'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);

    console.log('📊 Colonnes de la table fosas:\n');
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME}`);
      console.log(`  Type: ${col.COLUMN_TYPE}`);
      console.log(`  Nullable: ${col.IS_NULLABLE}`);
      console.log(`  Default: ${col.COLUMN_DEFAULT || 'NULL'}`);
      console.log('');
    });

    console.log(`\n✅ Total: ${columns.length} colonnes`);

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await conn.end();
  }
}

checkFosaStructure();
