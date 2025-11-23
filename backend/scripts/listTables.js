const mysql = require('mysql2/promise');
require('dotenv').config();

async function listTables() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('📋 Liste des tables dans la base de données:\n');

    const [tables] = await conn.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    // Tables à exclure de l'import
    const excludedTables = ['regions', 'departements', 'arrondissements', 'districts', 'airesantes'];

    console.log('Tables à importer:');
    const importTables = tableNames.filter(t => !excludedTables.includes(t));
    importTables.forEach(table => console.log(`  - ${table}`));

    console.log('\nTables exclues:');
    excludedTables.forEach(table => {
      if (tableNames.includes(table)) {
        console.log(`  - ${table}`);
      }
    });

    // Pour chaque table à importer, obtenir sa structure
    console.log('\n📊 Structure des tables à importer:\n');
    for (const table of importTables) {
      console.log(`\n=== ${table.toUpperCase()} ===`);
      const [columns] = await conn.execute(`
        SELECT
          c.COLUMN_NAME,
          c.DATA_TYPE,
          c.COLUMN_KEY,
          k.REFERENCED_TABLE_NAME,
          k.REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS c
        LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
          ON c.TABLE_SCHEMA = k.TABLE_SCHEMA
          AND c.TABLE_NAME = k.TABLE_NAME
          AND c.COLUMN_NAME = k.COLUMN_NAME
          AND k.REFERENCED_TABLE_NAME IS NOT NULL
        WHERE c.TABLE_SCHEMA = ?
        AND c.TABLE_NAME = ?
        ORDER BY c.ORDINAL_POSITION
      `, [process.env.DB_NAME, table]);

      columns.forEach(col => {
        let info = `  ${col.COLUMN_NAME} (${col.DATA_TYPE})`;
        if (col.COLUMN_KEY === 'PRI') info += ' [PRIMARY KEY]';
        if (col.REFERENCED_TABLE_NAME) {
          info += ` → FK vers ${col.REFERENCED_TABLE_NAME}.${col.REFERENCED_COLUMN_NAME}`;
        }
        console.log(info);
      });
    }

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await conn.end();
  }
}

listTables();
