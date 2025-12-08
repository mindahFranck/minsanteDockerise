import { exportGenericToPDF, exportGenericToExcel } from './exportUtils';

/**
 * Export pour PersonnelsPage
 */
export const exportPersonnelsToPDF = (data: any[]) => {
  exportGenericToPDF(
    data,
    [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nom', dataKey: 'nom' },
      { header: 'Prénom', dataKey: 'prenom' },
      { header: 'Catégorie', dataKey: 'categorie' },
      { header: 'Spécialité', dataKey: 'specialite' },
      { header: 'Statut', dataKey: 'statut' },
    ],
    'Liste du Personnel',
    `personnel_${new Date().toISOString().split('T')[0]}`
  );
};

export const exportPersonnelsToExcel = (data: any[]) => {
  exportGenericToExcel(
    data,
    [
      { header: 'ID', key: 'id' },
      { header: 'Nom', key: 'nom' },
      { header: 'Prénom', key: 'prenom' },
      { header: 'Catégorie', key: 'categorie' },
      { header: 'Spécialité', key: 'specialite' },
      { header: 'Statut', key: 'statut' },
      { header: 'Date d\'embauche', key: 'dateEmbauche' },
    ],
    `personnel_${new Date().toISOString().split('T')[0]}`,
    'Personnel'
  );
};

/**
 * Export pour EquipementsPage
 */
export const exportEquipementsToPDF = (data: any[]) => {
  exportGenericToPDF(
    data,
    [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nom', dataKey: 'nom' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Marque', dataKey: 'marque' },
      { header: 'Modèle', dataKey: 'modele' },
      { header: 'État', dataKey: 'etat' },
      { header: 'Quantité', dataKey: 'quantite' },
    ],
    'Liste des Équipements',
    `equipements_${new Date().toISOString().split('T')[0]}`
  );
};

export const exportEquipementsToExcel = (data: any[]) => {
  exportGenericToExcel(
    data,
    [
      { header: 'ID', key: 'id' },
      { header: 'Nom', key: 'nom' },
      { header: 'Type', key: 'type' },
      { header: 'Marque', key: 'marque' },
      { header: 'Modèle', key: 'modele' },
      { header: 'État', key: 'etat' },
      { header: 'Quantité', key: 'quantite' },
      { header: 'Date d\'acquisition', key: 'dateAcquisition' },
      { header: 'Valeur', key: 'valeur' },
    ],
    `equipements_${new Date().toISOString().split('T')[0]}`,
    'Équipements'
  );
};

/**
 * Export pour BatimentsPage
 */
export const exportBatimentsToPDF = (data: any[]) => {
  exportGenericToPDF(
    data,
    [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nom', dataKey: 'nom' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Surface (m²)', dataKey: 'surface' },
      { header: 'État', dataKey: 'etat' },
      { header: 'Année Construction', dataKey: 'anneeConstruction' },
    ],
    'Liste des Bâtiments',
    `batiments_${new Date().toISOString().split('T')[0]}`
  );
};

export const exportBatimentsToExcel = (data: any[]) => {
  exportGenericToExcel(
    data,
    [
      { header: 'ID', key: 'id' },
      { header: 'Nom', key: 'nom' },
      { header: 'Type', key: 'type' },
      { header: 'Surface (m²)', key: 'surface' },
      { header: 'État', key: 'etat' },
      { header: 'Année Construction', key: 'anneeConstruction' },
      { header: 'Dernière Rénovation', key: 'derniereRenovation' },
      { header: 'Nombre d\'étages', key: 'nombreEtages' },
    ],
    `batiments_${new Date().toISOString().split('T')[0]}`,
    'Bâtiments'
  );
};

/**
 * Export pour RegionsPage
 */
export const exportRegionsToPDF = (data: any[]) => {
  exportGenericToPDF(
    data,
    [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nom', dataKey: 'nom' },
      { header: 'Code', dataKey: 'code' },
      { header: 'Chef-lieu', dataKey: 'chefLieu' },
    ],
    'Liste des Régions',
    `regions_${new Date().toISOString().split('T')[0]}`
  );
};

export const exportRegionsToExcel = (data: any[]) => {
  exportGenericToExcel(
    data,
    [
      { header: 'ID', key: 'id' },
      { header: 'Nom', key: 'nom' },
      { header: 'Code', key: 'code' },
      { header: 'Chef-lieu', key: 'chefLieu' },
      { header: 'Population', key: 'population' },
      { header: 'Superficie', key: 'superficie' },
    ],
    `regions_${new Date().toISOString().split('T')[0]}`,
    'Régions'
  );
};

/**
 * Export pour DepartementsPage
 */
export const exportDepartementsToPDF = (data: any[]) => {
  exportGenericToPDF(
    data,
    [
      { header: 'ID', dataKey: 'id' },
      { header: 'Département', dataKey: 'departement' },
      { header: 'Code', dataKey: 'code' },
      { header: 'Région', dataKey: 'regionNom' },
    ],
    'Liste des Départements',
    `departements_${new Date().toISOString().split('T')[0]}`
  );
};

export const exportDepartementsToExcel = (data: any[]) => {
  exportGenericToExcel(
    data,
    [
      { header: 'ID', key: 'id' },
      { header: 'Département', key: 'departement' },
      { header: 'Code', key: 'code' },
      { header: 'Région', key: 'regionNom' },
      { header: 'Chef-lieu', key: 'chefLieu' },
    ],
    `departements_${new Date().toISOString().split('T')[0]}`,
    'Départements'
  );
};

/**
 * Export pour ArrondissementsPage
 */
export const exportArrondissementsToPDF = (data: any[]) => {
  exportGenericToPDF(
    data,
    [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nom', dataKey: 'nom' },
      { header: 'Code', dataKey: 'code' },
      { header: 'Département', dataKey: 'departementNom' },
    ],
    'Liste des Arrondissements',
    `arrondissements_${new Date().toISOString().split('T')[0]}`
  );
};

export const exportArrondissementsToExcel = (data: any[]) => {
  exportGenericToExcel(
    data,
    [
      { header: 'ID', key: 'id' },
      { header: 'Nom', key: 'nom' },
      { header: 'Code', key: 'code' },
      { header: 'Département', key: 'departementNom' },
    ],
    `arrondissements_${new Date().toISOString().split('T')[0]}`,
    'Arrondissements'
  );
};

/**
 * Export pour MaterielroulantsPage
 */
export const exportMaterielroulantsToPDF = (data: any[]) => {
  exportGenericToPDF(
    data,
    [
      { header: 'ID', dataKey: 'id' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Marque', dataKey: 'marque' },
      { header: 'Modèle', dataKey: 'modele' },
      { header: 'Immatriculation', dataKey: 'immatriculation' },
      { header: 'État', dataKey: 'etat' },
      { header: 'Année', dataKey: 'annee' },
    ],
    'Liste du Matériel Roulant',
    `materiel_roulant_${new Date().toISOString().split('T')[0]}`
  );
};

export const exportMaterielroulantsToExcel = (data: any[]) => {
  exportGenericToExcel(
    data,
    [
      { header: 'ID', key: 'id' },
      { header: 'Type', key: 'type' },
      { header: 'Marque', key: 'marque' },
      { header: 'Modèle', key: 'modele' },
      { header: 'Immatriculation', key: 'immatriculation' },
      { header: 'État', key: 'etat' },
      { header: 'Année', key: 'annee' },
      { header: 'Kilométrage', key: 'kilometrage' },
      { header: 'Dernière Révision', key: 'derniereRevision' },
    ],
    `materiel_roulant_${new Date().toISOString().split('T')[0]}`,
    'Matériel Roulant'
  );
};

/**
 * Export pour DegradationsPage
 */
export const exportDegradationsToPDF = (data: any[]) => {
  exportGenericToPDF(
    data,
    [
      { header: 'ID', dataKey: 'id' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Gravité', dataKey: 'gravite' },
      { header: 'Statut', dataKey: 'statut' },
      { header: 'Date Signalement', dataKey: 'dateSignalement' },
    ],
    'Liste des Dégradations',
    `degradations_${new Date().toISOString().split('T')[0]}`
  );
};

export const exportDegradationsToExcel = (data: any[]) => {
  exportGenericToExcel(
    data,
    [
      { header: 'ID', key: 'id' },
      { header: 'Type', key: 'type' },
      { header: 'Description', key: 'description' },
      { header: 'Gravité', key: 'gravite' },
      { header: 'Statut', key: 'statut' },
      { header: 'Date Signalement', key: 'dateSignalement' },
      { header: 'Date Résolution', key: 'dateResolution' },
      { header: 'Coût Estimé', key: 'coutEstime' },
    ],
    `degradations_${new Date().toISOString().split('T')[0]}`,
    'Dégradations'
  );
};
