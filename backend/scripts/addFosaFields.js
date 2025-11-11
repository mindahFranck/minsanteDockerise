require('dotenv').config();
const mysql = require('mysql2/promise');

async function addFosaFields() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Connected to database\n');

  try {
    console.log('=== Adding new fields to FOSA table ===\n');

    // Coordonnées
    await conn.execute(`
      ALTER TABLE fosas
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) NULL,
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7) NULL
    `);
    console.log('✓ Added longitude and latitude');

    // Fréquentation
    await conn.execute(`
      ALTER TABLE fosas
      ADD COLUMN IF NOT EXISTS nbre_visiteurs_jour INT NULL,
      ADD COLUMN IF NOT EXISTS nbre_patients_ambulants INT NULL,
      ADD COLUMN IF NOT EXISTS nbre_patients_hospitalises INT NULL
    `);
    console.log('✓ Added fréquentation fields');

    // Ressources Humaines
    await conn.execute(`
      ALTER TABLE fosas
      ADD COLUMN IF NOT EXISTS nbre_medecins_generalistes INT NULL,
      ADD COLUMN IF NOT EXISTS nbre_medecins_specialistes INT NULL,
      ADD COLUMN IF NOT EXISTS nbre_infirmiers_sup INT NULL,
      ADD COLUMN IF NOT EXISTS nbre_infirmiers_de INT NULL,
      ADD COLUMN IF NOT EXISTS nbre_personnel_appui INT NULL
    `);
    console.log('✓ Added ressources humaines fields');

    // Infrastructures
    await conn.execute(`
      ALTER TABLE fosas
      ADD COLUMN IF NOT EXISTS nbre_total_batiments INT NULL,
      ADD COLUMN IF NOT EXISTS designation_batiments TEXT NULL,
      ADD COLUMN IF NOT EXISTS surface_totale_batie DECIMAL(10, 2) NULL,
      ADD COLUMN IF NOT EXISTS services_abrités TEXT NULL,
      ADD COLUMN IF NOT EXISTS nbre_batiments_fonctionnels INT NULL,
      ADD COLUMN IF NOT EXISTS nbre_batiments_abandonnes INT NULL,
      ADD COLUMN IF NOT EXISTS etat_general_lieux VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS nbre_lits_operationnels INT NULL,
      ADD COLUMN IF NOT EXISTS nbre_total_lits_disponibles INT NULL,
      ADD COLUMN IF NOT EXISTS nbre_lits_a_ajouter INT NULL,
      ADD COLUMN IF NOT EXISTS nbre_batiments_maintenance_lourde INT NULL,
      ADD COLUMN IF NOT EXISTS nbre_batiments_maintenance_legere INT NULL
    `);
    console.log('✓ Added infrastructures fields');

    // Budgets
    await conn.execute(`
      ALTER TABLE fosas
      ADD COLUMN IF NOT EXISTS budget_travaux_neufs_annee_moins2 DECIMAL(15, 2) NULL,
      ADD COLUMN IF NOT EXISTS budget_travaux_neufs_annee_moins1 DECIMAL(15, 2) NULL,
      ADD COLUMN IF NOT EXISTS budget_travaux_neufs_annee_courante DECIMAL(15, 2) NULL,
      ADD COLUMN IF NOT EXISTS budget_travaux_neufs_annee_plus1 DECIMAL(15, 2) NULL,
      ADD COLUMN IF NOT EXISTS budget_maintenance_annee_moins2 DECIMAL(15, 2) NULL,
      ADD COLUMN IF NOT EXISTS budget_maintenance_annee_moins1 DECIMAL(15, 2) NULL,
      ADD COLUMN IF NOT EXISTS budget_maintenance_annee_courante DECIMAL(15, 2) NULL,
      ADD COLUMN IF NOT EXISTS budget_maintenance_annee_plus1 DECIMAL(15, 2) NULL
    `);
    console.log('✓ Added budget fields');

    // Autres infrastructures
    await conn.execute(`
      ALTER TABLE fosas
      ADD COLUMN IF NOT EXISTS connection_electricite BOOLEAN NULL,
      ADD COLUMN IF NOT EXISTS connection_eau_potable BOOLEAN NULL,
      ADD COLUMN IF NOT EXISTS existence_forage BOOLEAN NULL,
      ADD COLUMN IF NOT EXISTS existence_chateau_eau BOOLEAN NULL,
      ADD COLUMN IF NOT EXISTS existence_energie_solaire BOOLEAN NULL,
      ADD COLUMN IF NOT EXISTS existence_incinerateur BOOLEAN NULL
    `);
    console.log('✓ Added autres infrastructures fields');

    // Equipements
    await conn.execute(`
      ALTER TABLE fosas
      ADD COLUMN IF NOT EXISTS etat_general_equipements VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS budget_equipements_annee_courante DECIMAL(15, 2) NULL,
      ADD COLUMN IF NOT EXISTS budget_equipements_annee_plus1 DECIMAL(15, 2) NULL,
      ADD COLUMN IF NOT EXISTS budget_equipements_mineurs_annee_courante DECIMAL(15, 2) NULL,
      ADD COLUMN IF NOT EXISTS budget_equipements_mineurs_annee_plus1 DECIMAL(15, 2) NULL
    `);
    console.log('✓ Added equipements fields');

    console.log('\n✅ All fields added successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await conn.end();
    console.log('\nConnection closed');
  }
}

addFosaFields();
