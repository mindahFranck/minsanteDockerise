import { Router } from 'express';
import multer from 'multer';
import { ImportController } from '../controllers/ImportController';
import { authenticate } from '../middleware/auth';

const router = Router();
const importController = new ImportController();

// Configuration de multer pour l'upload de fichiers Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les fichiers Excel
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) sont acceptés'));
    }
  },
});

/**
 * @swagger
 * /api/import/tables:
 *   get:
 *     summary: Obtenir la liste des tables importables
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des tables importables
 */
router.get('/tables', authenticate, importController.getImportableTables);

/**
 * @swagger
 * /api/import/{table}/structure:
 *   get:
 *     summary: Obtenir la structure d'une table pour l'import
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom de la table
 *     responses:
 *       200:
 *         description: Structure de la table avec les clés étrangères
 */
router.get('/:table/structure', authenticate, importController.getTableStructure);

/**
 * @swagger
 * /api/import/{table}/template:
 *   get:
 *     summary: Télécharger un fichier modèle Excel pour une table
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom de la table
 *     responses:
 *       200:
 *         description: Fichier Excel modèle
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:table/template', authenticate, importController.downloadTemplate);

/**
 * @swagger
 * /api/import/{table}:
 *   post:
 *     summary: Importer des données depuis un fichier Excel
 *     tags: [Import]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom de la table
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Fichier Excel à importer
 *               foreignKeyMappings:
 *                 type: string
 *                 description: JSON des mappages des clés étrangères
 *     responses:
 *       200:
 *         description: Import réussi
 */
router.post('/:table', authenticate, upload.single('file'), importController.importData);

export default router;
