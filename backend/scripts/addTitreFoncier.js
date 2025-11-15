const mysql = require('mysql2/promise');
require('dotenv').config();

async function addTitreFoncier() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔄 Ajout de la colonne titre foncier...');

    // Ajouter la colonne pour le titre foncier
    try {
      await conn.execute(`
        ALTER TABLE fosas
        ADD COLUMN a_titre_foncier BOOLEAN DEFAULT NULL COMMENT 'La FOSA a-t-elle un titre foncier'
      `);
      console.log('✅ Colonne ajoutée: a_titre_foncier');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Colonne a_titre_foncier existe déjà');
      } else {
        throw err;
      }
    }

    console.log('\n✨ Ajout terminé!');
    console.log('\n📊 Nouvelle colonne ajoutée:');
    console.log('- a_titre_foncier (BOOLEAN) - La FOSA a-t-elle un titre foncier ?');

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await conn.end();
  }
}

addTitreFoncier();
