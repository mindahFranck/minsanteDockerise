const mysql = require('mysql2/promise');
require('dotenv').config();

async function simplifyFosaTable() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('🔄 Simplification de la table fosas...');

    // Liste des colonnes à supprimer (garder seulement les colonnes de base)
    const columnsToDelete = [
      // Fréquentation
      'nbre_visiteurs_jour',
      'nbre_patients_ambulants',
      'nbre_patients_hospitalises',
      // Ressources Humaines
      'nbre_medecins_generalistes',
      'nbre_medecins_specialistes',
      'nbre_infirmiers_sup',
      'nbre_infirmiers_de',
      'nbre_personnel_appui',
      // Infrastructures
      'nbre_total_batiments',
      'designation_batiments',
      'surface_totale_batie',
      'services_abrités',
      'nbre_batiments_fonctionnels',
      'nbre_batiments_abandonnes',
      'etat_general_lieux',
      'nbre_lits_operationnels',
      'nbre_total_lits_disponibles',
      'nbre_lits_a_ajouter',
      'nbre_batiments_maintenance_lourde',
      'nbre_batiments_maintenance_legere',
      // Autres infrastructures
      'connection_electricite',
      'connection_eau_potable',
      'existence_forage',
      'existence_chateau_eau',
      'existence_energie_solaire',
      'existence_incinerateur',
      // Équipements
      'etat_general_equipements',
      'budget_equipements_annee_courante',
      'budget_equipements_annee_plus1',
      'budget_equipements_mineurs_annee_courante',
      'budget_equipements_mineurs_annee_plus1',
      // Budgets
      'budget_travaux_neufs_annee_moins2',
      'budget_travaux_neufs_annee_moins1',
      'budget_travaux_neufs_annee_courante',
      'budget_travaux_neufs_annee_plus1',
      'budget_maintenance_annee_moins2',
      'budget_maintenance_annee_moins1',
      'budget_maintenance_annee_courante',
      'budget_maintenance_annee_plus1',
    ];

    // Vérifier quelles colonnes existent
    const [columns] = await conn.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'fosas'
    `, [process.env.DB_NAME]);

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    const columnsToProcess = columnsToDelete.filter(col => existingColumns.includes(col));

    console.log(`📋 ${columnsToProcess.length} colonnes à supprimer sur ${columnsToDelete.length} demandées`);

    // Supprimer chaque colonne
    for (const column of columnsToProcess) {
      try {
        await conn.execute(`ALTER TABLE fosas DROP COLUMN ${column}`);
        console.log(`✅ Colonne supprimée: ${column}`);
      } catch (err) {
        console.error(`❌ Erreur suppression ${column}:`, err.message);
      }
    }

    console.log('\n✨ Simplification terminée!');
    console.log('\n📊 Colonnes restantes dans la table fosas:');
    console.log('- id');
    console.log('- nom');
    console.log('- type');
    console.log('- capacite_lits');
    console.log('- est_ferme');
    console.log('- situation');
    console.log('- image');
    console.log('- arrondissement_id');
    console.log('- airesante_id');
    console.log('- longitude');
    console.log('- latitude');
    console.log('- created_at');
    console.log('- updated_at');

  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await conn.end();
  }
}

simplifyFosaTable();
