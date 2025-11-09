require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixRegionNames() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Connected to database\n');

  try {
    // Mapping des noms anglais vers français
    const regionMapping = {
      'North West': 'Nord-Ouest',
      'South West': 'Sud-Ouest',
      'Extreme Nord': 'Extreme-Nord'
    };

    console.log('=== Correction des noms de régions ===\n');

    for (const [englishName, frenchName] of Object.entries(regionMapping)) {
      // Mettre à jour les noms dans la table districts
      const [result] = await conn.execute(
        'UPDATE districts SET region = ? WHERE region = ?',
        [frenchName, englishName]
      );

      if (result.affectedRows > 0) {
        console.log(`✓ ${result.affectedRows} districts mis à jour: "${englishName}" → "${frenchName}"`);
      }
    }

    console.log('\n=== Mise à jour des regionId ===\n');

    // Récupérer toutes les régions
    const [regions] = await conn.execute('SELECT id, nom FROM regions');
    console.log(`Trouvé ${regions.length} régions\n`);

    let totalUpdated = 0;

    // Pour chaque région, mettre à jour les districts
    for (const region of regions) {
      const [result] = await conn.execute(
        'UPDATE districts SET region_id = ? WHERE region = ? AND (region_id IS NULL OR region_id = 0)',
        [region.id, region.nom]
      );

      if (result.affectedRows > 0) {
        console.log(`✓ ${result.affectedRows} districts mis à jour pour la région "${region.nom}" (ID: ${region.id})`);
        totalUpdated += result.affectedRows;
      }
    }

    console.log(`\nTotal: ${totalUpdated} districts mis à jour\n`);

    // Vérifier les résultats
    const [stats] = await conn.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN region_id IS NOT NULL AND region_id > 0 THEN 1 ELSE 0 END) as with_region_id,
        SUM(CASE WHEN region_id IS NULL OR region_id = 0 THEN 1 ELSE 0 END) as without_region_id
      FROM districts
    `);

    console.log('=== Statistiques finales ===');
    console.log(`Total districts: ${stats[0].total}`);
    console.log(`Avec regionId: ${stats[0].with_region_id}`);
    console.log(`Sans regionId: ${stats[0].without_region_id}`);

    // Afficher les districts sans regionId
    if (stats[0].without_region_id > 0) {
      console.log('\n⚠️  Districts sans regionId:');
      const [orphans] = await conn.execute(`
        SELECT id, nom_ds, region
        FROM districts
        WHERE region_id IS NULL OR region_id = 0
        ORDER BY region
      `);

      orphans.forEach(d => {
        console.log(`   - ID: ${d.id}, Nom: ${d.nom_ds}, Région: "${d.region}"`);
      });
    }

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await conn.end();
    console.log('\nConnexion fermée');
  }
}

fixRegionNames();
