import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Configuration pour l'export PDF
 */
interface PDFExportConfig {
  title: string;
  filename: string;
  columns: { header: string; dataKey: string }[];
  data: any[];
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
}

/**
 * Configuration pour l'export Excel
 */
interface ExcelExportConfig {
  filename: string;
  sheetName: string;
  data: any[];
  columns?: { header: string; key: string }[];
}

/**
 * Exporte des données au format PDF
 */
export const exportToPDF = (config: PDFExportConfig): void => {
  const {
    title,
    filename,
    columns,
    data,
    orientation = 'landscape',
    pageSize = 'a4',
  } = config;

  // Créer un nouveau document PDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize,
  });

  // Ajouter le titre
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 15);

  // Ajouter la date d'export
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const exportDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Exporté le: ${exportDate}`, 14, 22);

  // Ajouter le tableau
  autoTable(doc, {
    head: [columns.map((col) => col.header)],
    body: data.map((row) =>
      columns.map((col) => {
        const value = row[col.dataKey];
        // Formater les booléens
        if (typeof value === 'boolean') {
          return value ? 'Oui' : 'Non';
        }
        // Formater les valeurs null/undefined
        if (value === null || value === undefined) {
          return '-';
        }
        return String(value);
      })
    ),
    startY: 28,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Bleu
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: 28, right: 14, bottom: 14, left: 14 },
  });

  // Ajouter le numéro de page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Télécharger le fichier
  doc.save(`${filename}.pdf`);
};

/**
 * Exporte des données au format Excel
 */
export const exportToExcel = (config: ExcelExportConfig): void => {
  const { filename, sheetName, data, columns } = config;

  // Préparer les données
  let exportData: any[] = data;

  // Si des colonnes sont spécifiées, filtrer les données
  if (columns && columns.length > 0) {
    exportData = data.map((row) => {
      const newRow: any = {};
      columns.forEach((col) => {
        let value = row[col.key];

        // Formater les booléens
        if (typeof value === 'boolean') {
          value = value ? 'Oui' : 'Non';
        }

        // Formater les valeurs null/undefined
        if (value === null || value === undefined) {
          value = '-';
        }

        newRow[col.header] = value;
      });
      return newRow;
    });
  }

  // Créer une nouvelle feuille de calcul
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Ajuster la largeur des colonnes
  const columnWidths = Object.keys(exportData[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...exportData.map((row) => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLength + 2, 50) }; // Max 50 caractères
  });
  worksheet['!cols'] = columnWidths;

  // Créer un nouveau classeur
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Télécharger le fichier
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Exporte des données FOSA au format PDF
 */
export const exportFosasToPDF = (fosas: any[]): void => {
  exportToPDF({
    title: 'Liste des Formations Sanitaires (FOSA)',
    filename: `fosas_${new Date().toISOString().split('T')[0]}`,
    orientation: 'landscape',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Nom', dataKey: 'nom' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Capacité Lits', dataKey: 'capaciteLits' },
      { header: 'Statut', dataKey: 'estFerme' },
      { header: 'Situation', dataKey: 'situation' },
      { header: 'Arrondissement', dataKey: 'arrondissementNom' },
    ],
    data: fosas.map((f) => ({
      ...f,
      estFerme: f.estFerme ? 'Fermé' : 'Ouvert',
      arrondissementNom: f.arrondissement?.nom || '-',
    })),
  });
};

/**
 * Exporte des données FOSA au format Excel
 */
export const exportFosasToExcel = (fosas: any[]): void => {
  exportToExcel({
    filename: `fosas_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'FOSA',
    data: fosas,
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Nom', key: 'nom' },
      { header: 'Type', key: 'type' },
      { header: 'Capacité Lits', key: 'capaciteLits' },
      { header: 'Statut Fermé', key: 'estFerme' },
      { header: 'Situation', key: 'situation' },
      { header: 'Longitude', key: 'longitude' },
      { header: 'Latitude', key: 'latitude' },
      { header: 'A Clôture', key: 'aCloture' },
      { header: 'A Titre Foncier', key: 'aTitreFoncier' },
      { header: 'Connectée Electricité', key: 'connecteeElectricite' },
      { header: 'Type Courant', key: 'typeCourant' },
      { header: 'Statut Rec', key: 'statutRec' },
      { header: 'Catégorie Rec', key: 'catRec' },
      { header: 'Nom Directeur', key: 'nomDirect' },
      { header: 'Org Unit', key: 'orgUnit' },
      { header: 'Fonctionnel', key: 'fonction' },
    ],
  });
};

/**
 * Exporte des données utilisateurs au format PDF
 */
export const exportUsersToPDF = (users: any[]): void => {
  exportToPDF({
    title: 'Liste des Utilisateurs',
    filename: `utilisateurs_${new Date().toISOString().split('T')[0]}`,
    orientation: 'landscape',
    columns: [
      { header: 'ID', dataKey: 'id' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Prénom', dataKey: 'firstName' },
      { header: 'Nom', dataKey: 'lastName' },
      { header: 'Rôle', dataKey: 'role' },
      { header: 'Actif', dataKey: 'isActive' },
      { header: 'Scope', dataKey: 'scopeType' },
    ],
    data: users.map((u) => ({
      ...u,
      isActive: u.isActive ? 'Oui' : 'Non',
      scopeType: u.scopeType || '-',
    })),
  });
};

/**
 * Exporte des données utilisateurs au format Excel
 */
export const exportUsersToExcel = (users: any[]): void => {
  exportToExcel({
    filename: `utilisateurs_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'Utilisateurs',
    data: users,
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Email', key: 'email' },
      { header: 'Prénom', key: 'firstName' },
      { header: 'Nom', key: 'lastName' },
      { header: 'Rôle', key: 'role' },
      { header: 'Actif', key: 'isActive' },
      { header: 'Type de Scope', key: 'scopeType' },
      { header: 'Dernière Connexion', key: 'lastLogin' },
      { header: 'Date de Création', key: 'createdAt' },
    ],
  });
};

/**
 * Exporte des données génériques au format PDF
 */
export const exportGenericToPDF = (
  data: any[],
  columns: { header: string; dataKey: string }[],
  title: string,
  filename?: string
): void => {
  exportToPDF({
    title,
    filename: filename || `export_${new Date().toISOString().split('T')[0]}`,
    orientation: 'landscape',
    columns,
    data,
  });
};

/**
 * Exporte des données génériques au format Excel
 */
export const exportGenericToExcel = (
  data: any[],
  columns: { header: string; key: string }[],
  filename?: string,
  sheetName?: string
): void => {
  exportToExcel({
    filename: filename || `export_${new Date().toISOString().split('T')[0]}`,
    sheetName: sheetName || 'Données',
    data,
    columns,
  });
};
