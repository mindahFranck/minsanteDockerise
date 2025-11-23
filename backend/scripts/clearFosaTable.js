const { Sequelize } = require('sequelize');
require('dotenv').config();

async function clearFosaTable() {
  console.log('🗑️  Vidage de la table FOSA\n');

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

    // Compter avant
    const [countBefore] = await sequelize.query('SELECT COUNT(*) as count FROM fosas');
    console.log(`📊 Nombre de FOSA avant suppression: ${countBefore[0].count}\n`);

    // Vider la table
    console.log('🗑️  Suppression de toutes les FOSA...');
    await sequelize.query('DELETE FROM fosas');
    console.log('✅ Table FOSA vidée\n');

    // Réinitialiser l'auto-increment
    console.log('🔄 Réinitialisation de l\'auto-increment...');
    await sequelize.query('ALTER TABLE fosas AUTO_INCREMENT = 1');
    console.log('✅ Auto-increment réinitialisé\n');

    // Compter après
    const [countAfter] = await sequelize.query('SELECT COUNT(*) as count FROM fosas');
    console.log(`📊 Nombre de FOSA après suppression: ${countAfter[0].count}\n`);

    await sequelize.close();
    console.log('✅ Opération terminée!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

clearFosaTable();
