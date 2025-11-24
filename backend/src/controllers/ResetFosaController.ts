import { Request, Response } from 'express';
import { getConnectionPool } from '../config/mysql';
import fs from 'fs';
import path from 'path';

export class ResetFosaController {
  /**
   * Vider et réimporter les données FOSA depuis le fichier SQL
   */
  static async resetAndReimport(req: Request, res: Response): Promise<void> {
    const connection = await getConnectionPool().getConnection();

    try {
      console.log('🔄 Début de la réinitialisation des FOSA...');

      // Étape 1: Compter les FOSA existantes
      const [countBefore] = await connection.execute<any[]>(
        'SELECT COUNT(*) as count FROM fosas'
      );
      const beforeCount = countBefore[0].count;
      console.log(`📊 FOSA avant suppression: ${beforeCount}`);

      // Étape 2: Vider la table FOSA
      console.log('🗑️  Suppression de toutes les FOSA...');
      await connection.execute('DELETE FROM fosas');
      console.log('✅ Table FOSA vidée');

      // Étape 3: Réinitialiser l'auto-increment
      console.log('🔄 Réinitialisation de l\'auto-increment...');
      await connection.execute('ALTER TABLE fosas AUTO_INCREMENT = 1');
      console.log('✅ Auto-increment réinitialisé');

      // Étape 4: Lire le fichier SQL
      const sqlFilePath = path.join(__dirname, '../../scripts/fosa (1).sql');
      console.log(`📖 Lecture du fichier: ${sqlFilePath}`);

      if (!fs.existsSync(sqlFilePath)) {
        throw new Error(`Fichier SQL introuvable: ${sqlFilePath}`);
      }

      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      console.log('✅ Fichier SQL lu');

      // Étape 5: Extraire les statements INSERT
      console.log('🔍 Extraction des statements INSERT...');
      const insertRegex = /INSERT INTO `fosas`[^;]+;/gi;
      const insertStatements = sqlContent.match(insertRegex);

      if (!insertStatements || insertStatements.length === 0) {
        throw new Error('Aucun statement INSERT trouvé dans le fichier SQL');
      }

      console.log(`✅ ${insertStatements.length} statements INSERT trouvés`);

      // Étape 6: Exécuter les INSERT statements
      console.log('📥 Import des données FOSA...');
      let successCount = 0;
      let errorCount = 0;
      const errors: Array<{ statement: number; error: string }> = [];

      for (let i = 0; i < insertStatements.length; i++) {
        try {
          await connection.query(insertStatements[i]);
          successCount++;

          // Log tous les 50 statements
          if ((i + 1) % 50 === 0) {
            console.log(`   ✅ ${i + 1} statements exécutés...`);
          }
        } catch (error: any) {
          errorCount++;
          errors.push({
            statement: i + 1,
            error: error.message
          });
        }
      }

      console.log('✨ Import terminé!');

      // Étape 7: Vérifier le nombre de FOSA après import
      const [countAfter] = await connection.execute<any[]>(
        'SELECT COUNT(*) as count FROM fosas'
      );
      const afterCount = countAfter[0].count;
      console.log(`📊 FOSA après import: ${afterCount}`);

      // Étape 8: Statistiques
      const [stats] = await connection.execute<any[]>(`
        SELECT
          COUNT(*) as total,
          COUNT(DISTINCT arrondissement_id) as arrondissements,
          COUNT(DISTINCT airesante_id) as aires_sante,
          SUM(CASE WHEN est_ferme = 0 THEN 1 ELSE 0 END) as operationnels,
          SUM(CASE WHEN est_ferme = 1 THEN 1 ELSE 0 END) as fermes
        FROM fosas
      `);

      connection.release();

      res.json({
        success: true,
        message: 'Réinitialisation et réimport terminés avec succès',
        data: {
          before: beforeCount,
          after: afterCount,
          statements: {
            total: insertStatements.length,
            success: successCount,
            errors: errorCount
          },
          statistics: stats[0],
          errors: errors.slice(0, 10) // Retourner max 10 erreurs
        }
      });

    } catch (error: any) {
      console.error('❌ Erreur:', error.message);
      connection.release();
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}
