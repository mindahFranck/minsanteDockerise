require('dotenv').config();
const mysql = require('mysql2/promise');

async function addRegionIdToDistricts() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Connected to database\n');

  try {
    console.log('=== Adding region_id column to districts table ===\n');

    // Ajouter la colonne region_id
    await conn.execute(`
      ALTER TABLE districts
      ADD COLUMN IF NOT EXISTS region_id BIGINT UNSIGNED NULL AFTER geom
    `);
    console.log('✓ Added region_id column');

    // Ajouter la contrainte de clé étrangère
    try {
      await conn.execute(`
        ALTER TABLE districts
        ADD CONSTRAINT districts_region_fk
        FOREIGN KEY (region_id) REFERENCES regions(id)
      `);
      console.log('✓ Added foreign key constraint');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Foreign key constraint already exists');
      } else {
        throw error;
      }
    }

    // Maintenant, mettre à jour region_id en fonction du nom de région
    console.log('\n=== Updating region_id based on region names ===\n');

    const regionMapping = {
      'Adamaoua': 1,
      'Centre': 2,
      'Est': 3,
      'Extreme-Nord': 4,
      'Littoral': 5,
      'Nord': 6,
      'Nord-Ouest': 7,
      'Ouest': 8,
      'Sud': 9,
      'Sud-Ouest': 10
    };

    for (const [regionName, regionId] of Object.entries(regionMapping)) {
      const [result] = await conn.execute(
        'UPDATE districts SET region_id = ? WHERE region = ?',
        [regionId, regionName]
      );
      console.log(`✓ Updated ${result.affectedRows} districts for region "${regionName}" (ID: ${regionId})`);
    }

    // Vérifier combien de districts ont un region_id
    const [rows] = await conn.execute(
      'SELECT COUNT(*) as total, SUM(CASE WHEN region_id IS NOT NULL THEN 1 ELSE 0 END) as with_region FROM districts'
    );
    console.log(`\n✅ Total: ${rows[0].total} districts, ${rows[0].with_region} with region_id`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await conn.end();
    console.log('\nConnection closed');
  }
}

addRegionIdToDistricts();
