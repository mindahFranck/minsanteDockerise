const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixNullValues() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔧 Correction des valeurs NULL...\n');

    // Mettre des valeurs par défaut pour longitude et latitude NULL
    console.log('📍 Mise à 0 pour longitude/latitude NULL...');
    await conn.execute('UPDATE fosas SET longitude = 0 WHERE longitude IS NULL');
    await conn.execute('UPDATE fosas SET latitude = 0 WHERE latitude IS NULL');
    console.log('✅ longitude/latitude corrigés\n');

    // Mettre 'Non spécifié' pour org_unit NULL
    console.log('🏢 Mise à "Non spécifié" pour org_unit NULL...');
    await conn.execute('UPDATE fosas SET org_unit = "Non spécifié" WHERE org_unit IS NULL');
    console.log('✅ org_unit corrigé\n');

    // Mettre une valeur par défaut pour image NULL
    console.log('🖼️  Mise à "default.jpg" pour image NULL...');
    await conn.execute('UPDATE fosas SET image = "default.jpg" WHERE image IS NULL');
    console.log('✅ image corrigé\n');

    // Mettre 'Non spécifié' pour type_courant NULL (car pas connecté à l'électricité)
    console.log('⚡ Mise à "Non applicable" pour type_courant NULL...');
    await conn.execute('UPDATE fosas SET type_courant = "Non applicable" WHERE type_courant IS NULL');
    console.log('✅ type_courant corrigé\n');

    console.log('✨ Toutes les valeurs NULL ont été corrigées!\n');

    // Vérifier à nouveau
    const [nullChecks] = await conn.execute(`
      SELECT
        SUM(CASE WHEN image IS NULL THEN 1 ELSE 0 END) as image_nulls,
        SUM(CASE WHEN longitude IS NULL THEN 1 ELSE 0 END) as longitude_nulls,
        SUM(CASE WHEN latitude IS NULL THEN 1 ELSE 0 END) as latitude_nulls,
        SUM(CASE WHEN type_courant IS NULL THEN 1 ELSE 0 END) as type_courant_nulls,
        SUM(CASE WHEN org_unit IS NULL THEN 1 ELSE 0 END) as org_unit_nulls
      FROM fosas
    `);

    console.log('📊 Vérification finale:');
    console.log(`  - image NULL: ${nullChecks[0].image_nulls}`);
    console.log(`  - longitude NULL: ${nullChecks[0].longitude_nulls}`);
    console.log(`  - latitude NULL: ${nullChecks[0].latitude_nulls}`);
    console.log(`  - type_courant NULL: ${nullChecks[0].type_courant_nulls}`);
    console.log(`  - org_unit NULL: ${nullChecks[0].org_unit_nulls}`);

    if (nullChecks[0].image_nulls === 0 &&
        nullChecks[0].longitude_nulls === 0 &&
        nullChecks[0].latitude_nulls === 0 &&
        nullChecks[0].type_courant_nulls === 0 &&
        nullChecks[0].org_unit_nulls === 0) {
      console.log('\n✅ Aucune valeur NULL! Tous les champs sont remplis.');
    }

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await conn.end();
  }
}

fixNullValues();
