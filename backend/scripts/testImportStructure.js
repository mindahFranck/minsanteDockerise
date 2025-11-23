const mysql = require('mysql2/promise');
require('dotenv').config();

async function testImportStructure() {
  console.log('🔍 Test de l\'endpoint /import/:table/structure\n');

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
    console.log(`📋 Testing structure for table: ${table}\n`);

    // Obtenir les colonnes
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [table]);

    console.log(`✅ Found ${columns.length} columns`);

    // Obtenir les clés étrangères
    const [foreignKeys] = await connection.execute(`
      SELECT
        k.COLUMN_NAME,
        k.REFERENCED_TABLE_NAME,
        k.REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
      WHERE k.TABLE_SCHEMA = DATABASE()
      AND k.TABLE_NAME = ?
      AND k.REFERENCED_TABLE_NAME IS NOT NULL
    `, [table]);

    console.log(`✅ Found ${foreignKeys.length} foreign keys\n`);

    // Tester le chargement des options pour chaque FK
    for (const fk of foreignKeys) {
      console.log(`  Testing FK: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}`);

      try {
        const tableName = connection.escapeId(fk.REFERENCED_TABLE_NAME);

        // Essayer avec 'nom'
        try {
          const [result] = await connection.query(
            `SELECT id, nom FROM ${tableName} LIMIT 100`
          );
          console.log(`    ✅ Loaded ${result.length} options using 'nom' column`);
        } catch (err) {
          // Essayer avec 'name'
          try {
            const [result] = await connection.query(
              `SELECT id, name as nom FROM ${tableName} LIMIT 100`
            );
            console.log(`    ✅ Loaded ${result.length} options using 'name' column`);
          } catch (err2) {
            // Essayer avec première varchar
            const [colInfo] = await connection.execute(`
              SELECT COLUMN_NAME
              FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND DATA_TYPE IN ('varchar', 'text')
              AND COLUMN_NAME != 'id'
              ORDER BY ORDINAL_POSITION
              LIMIT 1
            `, [fk.REFERENCED_TABLE_NAME]);

            if (colInfo.length > 0) {
              const colName = connection.escapeId(colInfo[0].COLUMN_NAME);
              const [result] = await connection.query(
                `SELECT id, ${colName} as nom FROM ${tableName} LIMIT 100`
              );
              console.log(`    ✅ Loaded ${result.length} options using '${colInfo[0].COLUMN_NAME}' column`);
            } else {
              const [result] = await connection.query(
                `SELECT id, CAST(id AS CHAR) as nom FROM ${tableName} LIMIT 100`
              );
              console.log(`    ✅ Loaded ${result.length} options using ID only`);
            }
          }
        }
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
      }
    }

    connection.release();
    console.log('\n✅ Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testImportStructure();
