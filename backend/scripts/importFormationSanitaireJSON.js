const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importFormationSanitaire() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔄 Import des données de formationSanitaire.json\n');

    // Lire le fichier JSON
    const jsonPath = path.join(__dirname, 'formationSanitaire.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    console.log(`📊 ${jsonData.length} formations sanitaires trouvées\n`);

    // Obtenir le premier ID valide pour arrondissement par défaut
    const [firstArrond] = await conn.execute('SELECT id FROM arrondissements ORDER BY id LIMIT 1');
    const defaultArrondissementId = firstArrond[0]?.id || 1;

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < jsonData.length; i++) {
      const fosa = jsonData[i];

      try {
        // Mapper les données JSON vers la structure de la table fosas
        const insertData = {
          nom: fosa.nomfs || `FOSA ${fosa.idfs}`,
          type: fosa.typefs || 'Non spécifié',
          capacite_lits: null, // Pas dans le JSON
          est_ferme: 0,
          situation: fosa.statutfs || 'Non spécifié',
          image: 'default.jpg',
          arrondissement_id: defaultArrondissementId,
          airesante_id: fosa.id_as || null, // Utiliser l'ID d'aire de santé du JSON
          longitude: fosa.longitud || null,
          latitude: fosa.latitud || null,
          a_cloture: 0,
          connectee_electricite: 0,
          type_courant: 'Non applicable',
          a_titre_foncier: 0,
          org_unit: fosa.district || null,
          fonction: fosa.fonctionfs === 'Oui' ? 1 : (fosa.fonctionfs === 'Non' ? 0 : 1),
          statut_rec: fosa.statutfs || 'Non spécifié',
          cat_rec: fosa.typefs || 'Non spécifié',
          nom_direct: 'Non spécifié',
          created_at: new Date(),
          updated_at: new Date()
        };

        // Vérifier que l'aire de santé existe si fournie
        if (insertData.airesante_id) {
          const [asExists] = await conn.execute(
            'SELECT id FROM airesantes WHERE id = ?',
            [insertData.airesante_id]
          );

          if (asExists.length === 0) {
            console.warn(`⚠️  Aire de santé ID ${insertData.airesante_id} non trouvée pour ${insertData.nom}`);
            insertData.airesante_id = null;
          }
        }

        // Si pas d'aire de santé valide, utiliser la première disponible
        if (!insertData.airesante_id) {
          const [firstAS] = await conn.execute('SELECT id FROM airesantes ORDER BY id LIMIT 1');
          insertData.airesante_id = firstAS[0]?.id || 1;
        }

        // Insertion
        await conn.execute(
          `INSERT INTO fosas (
            nom, type, capacite_lits, est_ferme, situation, image,
            arrondissement_id, airesante_id, longitude, latitude,
            a_cloture, connectee_electricite, type_courant, a_titre_foncier,
            org_unit, fonction, statut_rec, cat_rec, nom_direct,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            insertData.nom,
            insertData.type,
            insertData.capacite_lits,
            insertData.est_ferme,
            insertData.situation,
            insertData.image,
            insertData.arrondissement_id,
            insertData.airesante_id,
            insertData.longitude,
            insertData.latitude,
            insertData.a_cloture,
            insertData.connectee_electricite,
            insertData.type_courant,
            insertData.a_titre_foncier,
            insertData.org_unit,
            insertData.fonction,
            insertData.statut_rec,
            insertData.cat_rec,
            insertData.nom_direct,
            insertData.created_at,
            insertData.updated_at
          ]
        );

        successCount++;

        if ((i + 1) % 100 === 0) {
          console.log(`✅ ${i + 1} formations importées...`);
        }

      } catch (err) {
        errorCount++;
        errors.push({
          index: i + 1,
          nom: fosa.nomfs,
          error: err.message
        });

        if (errors.length <= 10) {
          console.error(`❌ Erreur sur ${fosa.nomfs}: ${err.message}`);
        }
      }
    }

    console.log('\n✨ Import terminé!');
    console.log(`✅ Succès: ${successCount} formations`);
    console.log(`❌ Erreurs: ${errorCount} formations\n`);

    if (errors.length > 10) {
      console.log(`📋 Affichage des 10 premières erreurs (${errors.length} total)`);
    }

    // Vérifier le total
    const [count] = await conn.execute('SELECT COUNT(*) as total FROM fosas');
    console.log(`📊 Total de formations sanitaires dans la base: ${count[0].total}`);

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await conn.end();
  }
}

importFormationSanitaire();
