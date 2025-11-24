const { Sequelize } = require('sequelize');
require('dotenv').config();

async function addGeomColumn() {
  console.log('🔧 Ajout de la colonne geom à la table FOSA\n');

  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Connecté à la base de données\n');

    // Vérifier si la colonne existe déjà
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'fosas'
      AND COLUMN_NAME = 'geom'
    `);

    if (columns.length > 0) {
      console.log('ℹ️  La colonne geom existe déjà');
    } else {
      console.log('➕ Ajout de la colonne geom...');
      await sequelize.query(`
        ALTER TABLE fosas
        ADD COLUMN geom GEOMETRY NULL
      `);
      console.log('✅ Colonne geom ajoutée\n');
    }

    // Mettre à jour les géométries à partir des coordonnées existantes
    console.log('📍 Mise à jour des géométries à partir des coordonnées...');
    const [updated] = await sequelize.query(`
      UPDATE fosas
      SET geom = ST_GeomFromText(
        CONCAT('POINT(', longitude, ' ', latitude, ')'),
        4326
      )
      WHERE longitude IS NOT NULL
      AND latitude IS NOT NULL
      AND (geom IS NULL OR ST_IsEmpty(geom) = 1)
    `);

    console.log(`✅ ${updated.affectedRows} géométries mises à jour\n`);

    // Pour les FOSA sans coordonnées, mettre un point par défaut (0,0) pour éviter les NULL
    console.log('🔧 Mise à jour des FOSA sans coordonnées...');
    const [defaultUpdated] = await sequelize.query(`
      UPDATE fosas
      SET geom = ST_GeomFromText('POINT(0 0)', 4326)
      WHERE geom IS NULL
    `);
    console.log(`✅ ${defaultUpdated.affectedRows} FOSA mises à jour avec point par défaut\n`);

    // Rendre la colonne NOT NULL maintenant que toutes les valeurs sont remplies
    console.log('🔒 Modification de la colonne geom en NOT NULL...');
    await sequelize.query(`
      ALTER TABLE fosas
      MODIFY COLUMN geom GEOMETRY NOT NULL
    `);
    console.log('✅ Colonne geom modifiée en NOT NULL\n');

    // Créer un index spatial sur la colonne geom
    console.log('🔍 Création de l\'index spatial...');
    try {
      await sequelize.query(`
        CREATE SPATIAL INDEX idx_fosa_geom ON fosas(geom)
      `);
      console.log('✅ Index spatial créé\n');
    } catch (error) {
      if (error.message.includes('Duplicate key name')) {
        console.log('ℹ️  L\'index spatial existe déjà\n');
      } else {
        throw error;
      }
    }

    // Vérifier les résultats
    const [stats] = await sequelize.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN geom IS NOT NULL THEN 1 ELSE 0 END) as avec_geom,
        SUM(CASE WHEN geom IS NULL THEN 1 ELSE 0 END) as sans_geom
      FROM fosas
    `);

    console.log('📊 Statistiques:');
    console.log(`   Total FOSA: ${stats[0].total}`);
    console.log(`   Avec geom: ${stats[0].avec_geom}`);
    console.log(`   Sans geom: ${stats[0].sans_geom}`);

    await sequelize.close();
    console.log('\n✅ Opération terminée avec succès!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

addGeomColumn();
