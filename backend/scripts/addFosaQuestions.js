const mysql = require('mysql2/promise');
require('dotenv').config();

async function addFosaQuestions() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔄 Ajout des colonnes de questions OUI/NON à la table fosas...');

    // Ajouter la colonne pour la clôture
    try {
      await conn.execute(`
        ALTER TABLE fosas
        ADD COLUMN a_cloture BOOLEAN DEFAULT NULL COMMENT 'La FOSA a-t-elle une clôture ?'
      `);
      console.log('✅ Colonne ajoutée: a_cloture');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Colonne a_cloture existe déjà');
      } else {
        throw err;
      }
    }

    // Ajouter la colonne pour la connexion électricité
    try {
      await conn.execute(`
        ALTER TABLE fosas
        ADD COLUMN connectee_electricite BOOLEAN DEFAULT NULL COMMENT 'La FOSA est-elle connectee au reseau national d electricite'
      `);
      console.log('✅ Colonne ajoutée: connectee_electricite');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Colonne connectee_electricite existe déjà');
      } else {
        throw err;
      }
    }

    // Ajouter la colonne pour le type de courant
    try {
      await conn.execute(`
        ALTER TABLE fosas
        ADD COLUMN type_courant VARCHAR(20) DEFAULT NULL COMMENT 'Type de courant (monophase ou triphase)'
      `);
      console.log('✅ Colonne ajoutée: type_courant');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Colonne type_courant existe déjà');
      } else {
        throw err;
      }
    }

    console.log('\n✨ Ajout des colonnes terminé!');
    console.log('\n📊 Nouvelles colonnes ajoutées:');
    console.log('- a_cloture (BOOLEAN) - La FOSA a-t-elle une clôture ?');
    console.log('- connectee_electricite (BOOLEAN) - La FOSA est-elle connectée au réseau national d\'électricité ?');
    console.log('- type_courant (VARCHAR) - Type de courant (monophasé ou triphasé)');

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await conn.end();
  }
}

addFosaQuestions();
