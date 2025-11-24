import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import sequelize from "../config/database";
import fs from "fs";
import path from "path";

export class ImportFosaController {
  clearAndImport = asyncHandler(async (req: Request, res: Response) => {
    console.log('🔄 Début de l\'import des données FOSA...\n');

    try {
      // Vider la table
      console.log('🗑️  Suppression des données existantes...');
      await sequelize.query('DELETE FROM fosas');
      await sequelize.query('ALTER TABLE fosas AUTO_INCREMENT = 1');
      console.log('✅ Table fosas vidée\n');

      // Récupérer des IDs valides pour les clés étrangères
      const [firstAiresante]: any = await sequelize.query('SELECT id FROM airesantes ORDER BY id LIMIT 1');
      const [firstArrond]: any = await sequelize.query('SELECT id FROM arrondissements ORDER BY id LIMIT 1');

      if (firstAiresante.length === 0 || firstArrond.length === 0) {
        throw new Error('Les tables airesantes ou arrondissements sont vides.');
      }

      const defaultAiresanteId = firstAiresante[0].id;
      const defaultArrondissementId = firstArrond[0].id;

      // Lire le fichier SQL
      console.log('📖 Lecture du fichier fosa (1).sql...');
      const sqlFilePath = path.join(__dirname, '../../scripts/fosa (1).sql');
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

      // Extraire les INSERT statements
      const insertPattern = /INSERT INTO `fosa` \([^)]+\) VALUES\s*\n((?:\([^)]+\),?\s*\n?)+);/g;
      const match = insertPattern.exec(sqlContent);

      if (!match) {
        throw new Error('Aucune instruction INSERT trouvée dans le fichier SQL');
      }

      const valuesText = match[1];
      const valuePattern = /\(([^)]+)\)/g;
      const values = [];
      let valueMatch;

      while ((valueMatch = valuePattern.exec(valuesText)) !== null) {
        values.push(valueMatch[1]);
      }

      console.log(`✅ ${values.length} enregistrements trouvés\n`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < values.length; i++) {
        try {
          const parts = parseValues(values[i]);

          const [
            id, fonction, statut_rec, tutelle_re, cat_rec, telephone,
            titre_foncier, document_f, superficie, nombre_de, cloture,
            longitude, latitude, geom, libelle
          ] = parts;

          const insertData = {
            nom: libelle || `FOSA ${id}`,
            arrondissement_id: defaultArrondissementId,
            airesante_id: defaultAiresanteId,
            type: cat_rec || 'Non spécifié',
            capacite_lits: nombre_de || 0,
            est_ferme: 0,
            situation: tutelle_re || 'Non spécifiée',
            longitude: parseFloat(longitude) || null,
            latitude: parseFloat(latitude) || null,
            a_cloture: convertToBoolean(cloture),
            connectee_electricite: 0,
            type_courant: null,
            a_titre_foncier: convertToBoolean(titre_foncier),
            fonction: convertToBoolean(fonction),
            statut_rec: statut_rec || 'Non spécifié',
            cat_rec: cat_rec || 'Non spécifié',
            nom_direct: 'Non spécifié',
            org_unit: null,
            image: null,
            created_at: new Date(),
            updated_at: new Date()
          };

          let geomValue = 'ST_GeomFromText(\'POINT(0 0)\', 4326)';
          if (insertData.longitude && insertData.latitude) {
            geomValue = `ST_GeomFromText('POINT(${insertData.longitude} ${insertData.latitude})', 4326)`;
          }

          await sequelize.query(
            `INSERT INTO fosas (
              nom, type, capacite_lits, est_ferme, situation, image,
              arrondissement_id, airesante_id, longitude, latitude, geom,
              a_cloture, connectee_electricite, type_courant, a_titre_foncier,
              org_unit, fonction, statut_rec, cat_rec, nom_direct,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${geomValue}, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
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
            }
          );

          successCount++;
        } catch (err: any) {
          console.error(`Erreur ligne ${i + 1}:`, err.message);
          errorCount++;
        }
      }

      const [count]: any = await sequelize.query('SELECT COUNT(*) as count FROM fosas');

      res.json({
        success: true,
        message: 'Import terminé',
        stats: {
          total: values.length,
          success: successCount,
          errors: errorCount,
          inDatabase: count[0].count
        }
      });

    } catch (error: any) {
      console.error('❌ Erreur:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

function parseValues(str: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let escapeNext = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === "'" && !escapeNext) {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    values.push(current.trim());
  }

  return values.map(v => {
    if (v === 'NULL' || v === 'null') return '';
    if (v.startsWith("'") && v.endsWith("'")) {
      return v.slice(1, -1);
    }
    return v;
  });
}

function convertToBoolean(value: string): number {
  if (!value || value === 'NULL' || value === 'null') return 0;
  const lower = value.toLowerCase().trim();
  if (lower === 'oui' || lower === 'yes' || lower === '1' || lower === 'true') return 1;
  return 0;
}
