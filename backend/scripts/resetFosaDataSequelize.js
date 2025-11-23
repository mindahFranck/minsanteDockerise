const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

async function resetFosaData() {
  console.log('🔄 Réinitialisation des données FOSA avec Sequelize\n');

  // Créer une connexion Sequelize
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
      }
    }
  );

  try {
    // Tester la connexion
    await sequelize.authenticate();
    console.log('✅ Connecté à la base de données\n');

    // Étape 1: Compter les FOSA existantes
    const [countBefore] = await sequelize.query('SELECT COUNT(*) as count FROM fosas');
    console.log(`📊 Nombre de FOSA avant suppression: ${countBefore[0].count}\n`);

    // Étape 2: Vider la table FOSA
    console.log('🗑️  Suppression de toutes les FOSA...');
    await sequelize.query('DELETE FROM fosas');
    console.log('✅ Table FOSA vidée\n');

    // Étape 3: Réinitialiser l'auto-increment
    console.log('🔄 Réinitialisation de l\'auto-increment...');
    await sequelize.query('ALTER TABLE fosas AUTO_INCREMENT = 1');
    console.log('✅ Auto-increment réinitialisé\n');

    // Étape 4: Lire le fichier SQL
    const sqlFilePath = path.join(__dirname, 'fosa (1).sql');
    console.log(`📖 Lecture du fichier: ${sqlFilePath}`);

    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Fichier SQL introuvable: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ Fichier SQL lu avec succès\n');

    // Étape 5: Extraire les statements INSERT
    console.log('🔍 Extraction des statements INSERT...');
    const insertRegex = /INSERT INTO `fosas`[^;]+;/gi;
    const insertStatements = sqlContent.match(insertRegex);

    if (!insertStatements || insertStatements.length === 0) {
      throw new Error('Aucun statement INSERT trouvé dans le fichier SQL');
    }

    console.log(`✅ ${insertStatements.length} statements INSERT trouvés\n`);

    // Étape 6: Exécuter les INSERT statements
    console.log('📥 Import des données FOSA...');
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < insertStatements.length; i++) {
      try {
        await sequelize.query(insertStatements[i]);
        successCount++;

        // Afficher la progression tous les 50 enregistrements
        if ((i + 1) % 50 === 0) {
          console.log(`   ✅ ${i + 1} statements exécutés...`);
        }
      } catch (error) {
        errorCount++;
        errors.push({
          statement: i + 1,
          error: error.message
        });
      }
    }

    console.log('\n✨ Import terminé!\n');
    console.log(`📊 Résumé:`);
    console.log(`   ✅ Succès: ${successCount} statements`);
    console.log(`   ❌ Erreurs: ${errorCount} statements\n`);

    if (errors.length > 0) {
      console.log('⚠️  Détails des erreurs:');
      errors.slice(0, 5).forEach(err => {
        console.log(`   Statement ${err.statement}: ${err.error}`);
      });
      if (errors.length > 5) {
        console.log(`   ... et ${errors.length - 5} autres erreurs`);
      }
      console.log('');
    }

    // Étape 7: Vérifier le nombre de FOSA après import
    const [countAfter] = await sequelize.query('SELECT COUNT(*) as count FROM fosas');
    console.log(`📊 Nombre de FOSA après import: ${countAfter[0].count}`);

    // Étape 8: Afficher quelques statistiques
    const [stats] = await sequelize.query(`
      SELECT
        COUNT(*) as total,
        COUNT(DISTINCT arrondissement_id) as arrondissements,
        COUNT(DISTINCT airesante_id) as aires_sante,
        SUM(CASE WHEN est_ferme = 0 THEN 1 ELSE 0 END) as operationnels,
        SUM(CASE WHEN est_ferme = 1 THEN 1 ELSE 0 END) as fermes
      FROM fosas
    `);

    console.log('\n📈 Statistiques:');
    console.log(`   Total FOSA: ${stats[0].total}`);
    console.log(`   Arrondissements: ${stats[0].arrondissements || 'N/A'}`);
    console.log(`   Aires de santé: ${stats[0].aires_sante || 'N/A'}`);
    console.log(`   Opérationnels: ${stats[0].operationnels}`);
    console.log(`   Fermés: ${stats[0].fermes}`);

    await sequelize.close();

    console.log('\n✅ Opération terminée avec succès!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur lors de la réinitialisation:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

resetFosaData();
