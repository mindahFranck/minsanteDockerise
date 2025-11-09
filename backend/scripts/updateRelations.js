require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateRelations() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Connected to database');

  try {
    // 1. Mettre à jour regionId dans districts
    console.log('\n=== Mise à jour de regionId dans districts ===');

    // Récupérer toutes les régions
    const [regions] = await conn.execute('SELECT id, nom FROM regions');
    console.log(`Trouvé ${regions.length} régions`);

    let updatedDistricts = 0;
    for (const region of regions) {
      const [result] = await conn.execute(
        'UPDATE districts SET region_id = ? WHERE region = ?',
        [region.id, region.nom]
      );
      if (result.affectedRows > 0) {
        console.log(`✓ ${result.affectedRows} districts mis à jour pour la région "${region.nom}" (ID: ${region.id})`);
        updatedDistricts += result.affectedRows;
      }
    }
    console.log(`\nTotal districts mis à jour: ${updatedDistricts}`);

    // Vérifier s'il reste des districts sans regionId
    const [orphanDistricts] = await conn.execute(
      'SELECT id, nom_ds, region FROM districts WHERE region_id IS NULL'
    );
    if (orphanDistricts.length > 0) {
      console.log(`\n⚠ ${orphanDistricts.length} districts n'ont pas de regionId:`);
      orphanDistricts.forEach(d => {
        console.log(`  - District "${d.nom_ds}" avec région "${d.region}"`);
      });
    }

    // 2. Mettre à jour districtId dans airesantes
    console.log('\n=== Mise à jour de districtId dans airesantes ===');

    // Récupérer tous les districts
    const [districts] = await conn.execute('SELECT id, nom_ds, nom FROM districts');
    console.log(`Trouvé ${districts.length} districts`);

    let updatedAiresantes = 0;
    for (const district of districts) {
      const districtName = district.nom_ds || district.nom;
      if (!districtName) continue;

      const [result] = await conn.execute(
        'UPDATE airesantes SET district_id = ? WHERE nom_dist = ?',
        [district.id, districtName]
      );
      if (result.affectedRows > 0) {
        console.log(`✓ ${result.affectedRows} aires de santé mises à jour pour le district "${districtName}" (ID: ${district.id})`);
        updatedAiresantes += result.affectedRows;
      }
    }
    console.log(`\nTotal aires de santé mises à jour: ${updatedAiresantes}`);

    // Vérifier s'il reste des aires de santé sans districtId
    const [orphanAiresantes] = await conn.execute(
      'SELECT id, nom_as, nom_dist FROM airesantes WHERE district_id IS NULL'
    );
    if (orphanAiresantes.length > 0) {
      console.log(`\n⚠ ${orphanAiresantes.length} aires de santé n'ont pas de districtId:`);
      orphanAiresantes.forEach(a => {
        console.log(`  - Aire de santé "${a.nom_as}" avec district "${a.nom_dist}"`);
      });
    }

    // 3. Afficher les statistiques finales
    console.log('\n=== Statistiques finales ===');
    const [districtStats] = await conn.execute(
      'SELECT COUNT(*) as total, COUNT(region_id) as with_region FROM districts'
    );
    console.log(`Districts: ${districtStats[0].with_region}/${districtStats[0].total} ont un regionId`);

    const [airesanteStats] = await conn.execute(
      'SELECT COUNT(*) as total, COUNT(district_id) as with_district FROM airesantes'
    );
    console.log(`Aires de santé: ${airesanteStats[0].with_district}/${airesanteStats[0].total} ont un districtId`);

  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  } finally {
    await conn.end();
    console.log('\nConnexion fermée');
  }
}

updateRelations().catch(err => {
  console.error('Error updating relations:', err);
  process.exit(1);
});
