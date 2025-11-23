import { Request, Response } from 'express';
import XLSX from 'xlsx';
import { asyncHandler } from '../utils/asyncHandler';
import pool from '../config/mysql';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ForeignKey {
  column: string;
  referenced_table: string;
  referenced_column: string;
}

interface TableStructure {
  columns: string[];
  foreignKeys: ForeignKey[];
  requiredColumns: string[];
}

export class ImportController {
  /**
   * Obtenir la structure d'une table pour l'import
   */
  getTableStructure = asyncHandler(async (req: Request, res: Response) => {
    const { table } = req.params;

    // Vérifier que la table est autorisée pour l'import
    const excludedTables = ['regions', 'departements', 'arrondissements', 'districts', 'airesantes'];
    if (excludedTables.includes(table)) {
      res.status(403).json({
        success: false,
        message: 'Cette table ne peut pas être importée'
      });
      return;
    }

    const connection = await pool.getConnection();

    try {
      // Obtenir les colonnes de la table
      const [columns] = await connection.execute<RowDataPacket[]>(`
        SELECT
          c.COLUMN_NAME,
          c.DATA_TYPE,
          c.IS_NULLABLE,
          c.COLUMN_KEY,
          c.EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS c
        WHERE c.TABLE_SCHEMA = DATABASE()
        AND c.TABLE_NAME = ?
        ORDER BY c.ORDINAL_POSITION
      `, [table]);

      // Obtenir les clés étrangères
      const [foreignKeys] = await connection.execute<RowDataPacket[]>(`
        SELECT
          k.COLUMN_NAME,
          k.REFERENCED_TABLE_NAME,
          k.REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
        WHERE k.TABLE_SCHEMA = DATABASE()
        AND k.TABLE_NAME = ?
        AND k.REFERENCED_TABLE_NAME IS NOT NULL
      `, [table]);

      // Obtenir les options pour chaque clé étrangère
      const foreignKeyOptions: any = {};
      for (const fk of foreignKeys) {
        try {
          // Construire la requête avec le nom de la table (échappé pour sécurité)
          const tableName = connection.escapeId(fk.REFERENCED_TABLE_NAME);

          // Essayer d'abord avec 'nom', puis avec d'autres colonnes courantes
          let options: RowDataPacket[] = [];

          try {
            // Essayer avec 'nom'
            const [result] = await connection.query<RowDataPacket[]>(
              `SELECT id, nom FROM ${tableName} LIMIT 100`
            );
            options = result;
          } catch (err: any) {
            // Si 'nom' n'existe pas, essayer avec 'name'
            try {
              const [result] = await connection.query<RowDataPacket[]>(
                `SELECT id, name as nom FROM ${tableName} LIMIT 100`
              );
              options = result;
            } catch (err2: any) {
              // Si ni 'nom' ni 'name', essayer avec la première colonne varchar
              const [colInfo] = await connection.execute<RowDataPacket[]>(`
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = ?
                AND DATA_TYPE IN ('varchar', 'text')
                AND COLUMN_NAME != 'id'
                ORDER BY ORDINAL_POSITION
                LIMIT 1
              `, [fk.REFERENCED_TABLE_NAME]);

              if (colInfo.length > 0) {
                const colName = connection.escapeId(colInfo[0].COLUMN_NAME);
                const [result] = await connection.query<RowDataPacket[]>(
                  `SELECT id, ${colName} as nom FROM ${tableName} LIMIT 100`
                );
                options = result;
              } else {
                // Dernière tentative: juste l'ID
                const [result] = await connection.query<RowDataPacket[]>(
                  `SELECT id, CAST(id AS CHAR) as nom FROM ${tableName} LIMIT 100`
                );
                options = result;
              }
            }
          }

          foreignKeyOptions[fk.COLUMN_NAME] = {
            referenced_table: fk.REFERENCED_TABLE_NAME,
            referenced_column: fk.REFERENCED_COLUMN_NAME,
            options: options
          };
        } catch (error: any) {
          console.error(`Error loading FK options for ${fk.COLUMN_NAME}:`, error.message);
          foreignKeyOptions[fk.COLUMN_NAME] = {
            referenced_table: fk.REFERENCED_TABLE_NAME,
            referenced_column: fk.REFERENCED_COLUMN_NAME,
            options: []
          };
        }
      }

      // Identifier les colonnes requises (non auto-increment, non nullable, sans default)
      const requiredColumns = columns
        .filter((col: any) =>
          col.IS_NULLABLE === 'NO' &&
          col.EXTRA !== 'auto_increment' &&
          col.COLUMN_NAME !== 'created_at' &&
          col.COLUMN_NAME !== 'updated_at'
        )
        .map((col: any) => col.COLUMN_NAME);

      res.json({
        success: true,
        data: {
          table,
          columns: columns.map((col: any) => ({
            name: col.COLUMN_NAME,
            type: col.DATA_TYPE,
            nullable: col.IS_NULLABLE === 'YES',
            key: col.COLUMN_KEY,
            auto_increment: col.EXTRA === 'auto_increment'
          })),
          foreignKeys: foreignKeyOptions,
          requiredColumns
        }
      });
    } finally {
      connection.release();
    }
  });

  /**
   * Télécharger un fichier modèle Excel pour une table
   */
  downloadTemplate = asyncHandler(async (req: Request, res: Response) => {
    const { table } = req.params;

    // Vérifier que la table est autorisée
    const excludedTables = ['regions', 'departements', 'arrondissements', 'districts', 'airesantes'];
    if (excludedTables.includes(table)) {
      res.status(403).json({
        success: false,
        message: 'Cette table ne peut pas être importée'
      });
      return;
    }

    const connection = await pool.getConnection();

    try {
      // Obtenir les colonnes de la table (SANS les FK)
      const [allColumns] = await connection.execute<RowDataPacket[]>(`
        SELECT
          c.COLUMN_NAME,
          c.DATA_TYPE,
          c.COLUMN_KEY,
          c.EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS c
        WHERE c.TABLE_SCHEMA = DATABASE()
        AND c.TABLE_NAME = ?
        AND c.EXTRA != 'auto_increment'
        AND c.COLUMN_NAME NOT IN ('created_at', 'updated_at')
        ORDER BY c.ORDINAL_POSITION
      `, [table]);

      // Obtenir les FK pour les exclure du template
      const [foreignKeys] = await connection.execute<RowDataPacket[]>(`
        SELECT k.COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
        WHERE k.TABLE_SCHEMA = DATABASE()
        AND k.TABLE_NAME = ?
        AND k.REFERENCED_TABLE_NAME IS NOT NULL
      `, [table]);

      const fkColumns = foreignKeys.map((fk: any) => fk.COLUMN_NAME);

      // Filtrer les colonnes pour exclure les FK
      const columns = allColumns.filter((col: any) => !fkColumns.includes(col.COLUMN_NAME));

      // Créer le fichier Excel (SANS les FK car elles sont dans les dropdowns)
      const headers = columns.map((col: any) => {
        return `${col.COLUMN_NAME} [${col.DATA_TYPE}]`;
      });

      // Créer une ligne d'exemple
      const exampleRow = columns.map((col: any) => {
        switch (col.DATA_TYPE) {
          case 'varchar':
          case 'text':
            return 'Texte exemple';
          case 'int':
          case 'bigint':
            return 123;
          case 'decimal':
          case 'double':
            return 12.34;
          case 'date':
            return '2025-01-01';
          case 'datetime':
            return '2025-01-01 12:00:00';
          case 'tinyint':
            return 1;
          default:
            return '';
        }
      });

      const workbook = XLSX.utils.book_new();
      const worksheetData = [headers, exampleRow];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      XLSX.utils.book_append_sheet(workbook, worksheet, table);

      // Générer le buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${table}_template.xlsx`);
      res.send(buffer);

    } finally {
      connection.release();
    }
  });

  /**
   * Importer des données depuis un fichier Excel
   */
  importData = asyncHandler(async (req: Request, res: Response) => {
    const { table } = req.params;
    const { foreignKeyMappings } = req.body; // Mappages des clés étrangères envoyés depuis le frontend

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
      return;
    }

    // Vérifier que la table est autorisée
    const excludedTables = ['regions', 'departements', 'arrondissements', 'districts', 'airesantes'];
    if (excludedTables.includes(table)) {
      res.status(403).json({
        success: false,
        message: 'Cette table ne peut pas être importée'
      });
      return;
    }

    const connection = await pool.getConnection();

    try {
      // Lire le fichier Excel
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Le fichier Excel est vide'
        });
        return;
      }

      // Obtenir la structure de la table
      const [columns] = await connection.execute<RowDataPacket[]>(`
        SELECT
          c.COLUMN_NAME,
          c.EXTRA
        FROM INFORMATION_SCHEMA.COLUMNS c
        WHERE c.TABLE_SCHEMA = DATABASE()
        AND c.TABLE_NAME = ?
        ORDER BY c.ORDINAL_POSITION
      `, [table]);

      // Filtrer les colonnes auto-increment et timestamps
      const insertableColumns = columns
        .filter((col: any) =>
          col.EXTRA !== 'auto_increment' &&
          col.COLUMN_NAME !== 'created_at' &&
          col.COLUMN_NAME !== 'updated_at'
        )
        .map((col: any) => col.COLUMN_NAME);

      let successCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      await connection.beginTransaction();

      try {
        for (let i = 0; i < data.length; i++) {
          const row: any = data[i];

          try {
            // Nettoyer les noms de colonnes (enlever les annotations)
            const cleanedRow: any = {};
            for (const key in row) {
              const cleanKey = key.split(' ')[0]; // Enlever les annotations comme "(FK -> table)"
              cleanedRow[cleanKey] = row[key];
            }

            // Appliquer les mappages de clés étrangères si fournis
            if (foreignKeyMappings) {
              for (const fkColumn in foreignKeyMappings) {
                // Si la colonne est vide ou undefined dans Excel, utiliser le mapping
                if (!cleanedRow[fkColumn] || cleanedRow[fkColumn] === '') {
                  cleanedRow[fkColumn] = foreignKeyMappings[fkColumn];
                }
              }
            }

            // Construire la requête d'insertion
            const columnsToInsert = insertableColumns.filter(col => cleanedRow[col] !== undefined);
            const values = columnsToInsert.map(col => cleanedRow[col]);

            const placeholders = columnsToInsert.map(() => '?').join(', ');
            const query = `INSERT INTO ${table} (${columnsToInsert.join(', ')}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW())`;

            await connection.execute(query, values);
            successCount++;

          } catch (error: any) {
            errorCount++;
            errors.push({
              row: i + 2, // +2 car ligne 1 = headers, et index commence à 0
              error: error.message
            });
          }
        }

        await connection.commit();

        res.json({
          success: true,
          message: 'Import terminé',
          data: {
            total: data.length,
            success: successCount,
            errors: errorCount,
            errorDetails: errors.slice(0, 10) // Limiter à 10 premières erreurs
          }
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      }

    } finally {
      connection.release();
    }
  });

  /**
   * Obtenir la liste des tables importables
   */
  getImportableTables = asyncHandler(async (req: Request, res: Response) => {
    const connection = await pool.getConnection();

    try {
      const [tables] = await connection.execute<RowDataPacket[]>(`
        SHOW TABLES
      `);

      const tableNames = tables.map(t => Object.values(t)[0] as string);
      const excludedTables = ['regions', 'departements', 'arrondissements', 'districts', 'airesantes'];

      const importableTables = tableNames.filter(t => !excludedTables.includes(t));

      res.json({
        success: true,
        data: importableTables
      });

    } finally {
      connection.release();
    }
  });
}
