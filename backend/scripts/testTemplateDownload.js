const mysql = require('mysql2/promise');
require('dotenv').config();

async function testTemplateDownload() {
  console.log('🔍 Test du téléchargement de template Excel\n');

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to database\n');

    // Test avec table fosas
    const table = 'fosas';
    console.log(`📋 Testing template for table: ${table}\n`);

    // Obtenir toutes les colonnes
    const [allColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [table]);

    console.log(`📊 Total columns in table: ${allColumns.length}`);
    console.log(`   Columns: ${allColumns.map(c => c.COLUMN_NAME).join(', ')}\n`);

    // Obtenir les clés étrangères à EXCLURE
    const [foreignKeys] = await connection.execute(`
      SELECT k.COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
      WHERE k.TABLE_SCHEMA = DATABASE()
      AND k.TABLE_NAME = ?
      AND k.REFERENCED_TABLE_NAME IS NOT NULL
    `, [table]);

    const fkColumns = foreignKeys.map(fk => fk.COLUMN_NAME);
    console.log(`🔗 Foreign key columns (to be excluded): ${fkColumns.length}`);
    console.log(`   FK Columns: ${fkColumns.join(', ')}\n`);

    // Filtrer les colonnes (exclure les FK, created_at, updated_at)
    const columns = allColumns.filter(col =>
      !fkColumns.includes(col.COLUMN_NAME) &&
      col.COLUMN_NAME !== 'created_at' &&
      col.COLUMN_NAME !== 'updated_at'
    );

    console.log(`✅ Columns in template (after filtering): ${columns.length}`);
    console.log(`   Template columns: ${columns.map(c => c.COLUMN_NAME).join(', ')}\n`);

    // Vérifier que les FK sont bien exclues
    const hasFK = columns.some(col => fkColumns.includes(col.COLUMN_NAME));
    if (hasFK) {
      console.log('❌ ERREUR: Le template contient encore des colonnes FK!');
    } else {
      console.log('✅ SUCCESS: Aucune colonne FK dans le template!');
    }

    connection.release();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testTemplateDownload();
