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
    // Désactiver temporairement les contraintes de clés étrangères
    console.log('Disabling foreign key checks...');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Note: La table districts n'a pas de colonne region_id, on passe directement aux aires de santé

    // Mettre à jour districtId dans airesantes
    console.log('\n=== Mise à jour de districtId dans airesantes ===');

    // Récupérer tous les districts
    const [districts] = await conn.execute('SELECT id, nom_ds FROM districts');
    console.log(`Trouvé ${districts.length} districts`);

    let updatedAiresantes = 0;
    for (const district of districts) {
      const districtName = district.nom_ds;
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

    // Réactiver les contraintes de clés étrangères
    console.log('\nRe-enabling foreign key checks...');
    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

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
