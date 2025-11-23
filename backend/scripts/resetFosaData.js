const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function resetFosaData() {
  console.log('🔄 Réinitialisation des données FOSA\n');

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
  });

  try {
    const connection = await pool.getConnection();
    console.log('✅ Connecté à la base de données\n');

    // Étape 1: Compter les FOSA existantes
    const [countBefore] = await connection.execute('SELECT COUNT(*) as count FROM fosas');
    console.log(`📊 Nombre de FOSA avant suppression: ${countBefore[0].count}\n`);

    // Étape 2: Vider la table FOSA
    console.log('🗑️  Suppression de toutes les FOSA...');
    await connection.execute('DELETE FROM fosas');
    console.log('✅ Table FOSA vidée\n');

    // Étape 3: Réinitialiser l'auto-increment
    console.log('🔄 Réinitialisation de l\'auto-increment...');
    await connection.execute('ALTER TABLE fosas AUTO_INCREMENT = 1');
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
        await connection.query(insertStatements[i]);
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
    const [countAfter] = await connection.execute('SELECT COUNT(*) as count FROM fosas');
    console.log(`📊 Nombre de FOSA après import: ${countAfter[0].count}`);

    // Étape 8: Afficher quelques statistiques
    const [stats] = await connection.execute(`
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
    console.log(`   Arrondissements: ${stats[0].arrondissements}`);
    console.log(`   Aires de santé: ${stats[0].aires_sante}`);
    console.log(`   Opérationnels: ${stats[0].operationnels}`);
    console.log(`   Fermés: ${stats[0].fermes}`);

    connection.release();
    await pool.end();

    console.log('\n✅ Opération terminée avec succès!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur lors de la réinitialisation:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

resetFosaData();
