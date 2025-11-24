import { Router } from "express"
import { FosaController } from "../controllers/FosaController"
import { authenticate, authorize } from "../middleware/auth"
import { validate } from "../middleware/validate"
import { upload } from "../middleware/upload"

const router = Router()
const controller = new FosaController()

/**
 * @swagger
 * /fosas:
 *   get:
 *     summary: Get all FOSA (health facilities)
 *     tags: [FOSA]
 *     responses:
 *       200:
 *         description: List of all FOSA
 */
router.get("/", controller.getAll)

/**
 * @swagger
 * /fosas/closed:
 *   get:
 *     summary: Get all closed FOSA
 *     tags: [FOSA]
 *     responses:
 *       200:
 *         description: List of closed FOSA
 */
router.get("/closed", controller.getClosedFosas)

/**
 * @swagger
 * /fosas/type/{type}:
 *   get:
 *     summary: Get FOSA by type
 *     tags: [FOSA]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of FOSA of specified type
 */
router.get("/type/:type", controller.getByType)

/**
 * @swagger
 * /fosas/map/all:
 *   get:
 *     summary: Get all FOSA for map display
 *     tags: [FOSA - Map]
 *     responses:
 *       200:
 *         description: List of FOSA with map data
 */
router.get("/map/all", controller.getAllForMap)

/**
 * @swagger
 * /fosas/map/{id}:
 *   get:
 *     summary: Get FOSA by ID for map
 *     tags: [FOSA - Map]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: FOSA details for map
 */
router.get("/map/:id", controller.getByIdForMap)

/**
 * @swagger
 * /fosas/map/airesante/{airesanteId}:
 *   get:
 *     summary: Get FOSA by health area for map
 *     tags: [FOSA - Map]
 *     parameters:
 *       - in: path
 *         name: airesanteId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: FOSA in specified health area
 */
router.get("/map/airesante/:airesanteId", controller.getByAiresanteForMap)

/**
 * @swagger
 * /fosas/spatial/region/{regionId}:
 *   get:
 *     summary: Get FOSA within a region (ST_Within spatial query)
 *     tags: [FOSA - Spatial]
 *     parameters:
 *       - in: path
 *         name: regionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: FOSA within the specified region
 */
router.get("/spatial/region/:regionId", controller.getFosasByRegionSpatial)

/**
 * @swagger
 * /fosas/spatial/departement/{departementId}:
 *   get:
 *     summary: Get FOSA within a department (ST_Within spatial query)
 *     tags: [FOSA - Spatial]
 *     parameters:
 *       - in: path
 *         name: departementId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: FOSA within the specified department
 */
router.get("/spatial/departement/:departementId", controller.getFosasByDepartementSpatial)

/**
 * @swagger
 * /fosas/spatial/arrondissement/{arrondissementId}:
 *   get:
 *     summary: Get FOSA within an arrondissement (ST_Within spatial query)
 *     tags: [FOSA - Spatial]
 *     parameters:
 *       - in: path
 *         name: arrondissementId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: FOSA within the specified arrondissement
 */
router.get("/spatial/arrondissement/:arrondissementId", controller.getFosasByArrondissementSpatial)

/**
 * @swagger
 * /fosas/spatial/district/{districtId}:
 *   get:
 *     summary: Get FOSA within a district (ST_Within spatial query)
 *     tags: [FOSA - Spatial]
 *     parameters:
 *       - in: path
 *         name: districtId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: FOSA within the specified district
 */
router.get("/spatial/district/:districtId", controller.getFosasByDistrictSpatial)

/**
 * @swagger
 * /fosas/spatial/airesante/{airesanteId}:
 *   get:
 *     summary: Get FOSA within a health area (ST_Within spatial query)
 *     tags: [FOSA - Spatial]
 *     parameters:
 *       - in: path
 *         name: airesanteId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: FOSA within the specified health area
 */
router.get("/spatial/airesante/:airesanteId", controller.getFosasByAiresanteSpatial)

/**
 * @swagger
 * /fosas/{id}:
 *   get:
 *     summary: Get FOSA by ID
 *     tags: [FOSA]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: FOSA details
 *       404:
 *         description: FOSA not found
 */
router.get("/:id", controller.getById)

/**
 * @swagger
 * /fosas:
 *   post:
 *     summary: Create a new FOSA
 *     tags: [FOSA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               type:
 *                 type: string
 *               arrondissementId:
 *                 type: integer
 *               airesanteId:
 *                 type: integer
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               capaciteLits:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: FOSA created successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  upload.single("image"),
  FosaController.validation,
  validate,
  controller.create,
)

/**
 * @swagger
 * /fosas/{id}:
 *   put:
 *     summary: Update a FOSA
 *     tags: [FOSA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               type:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: FOSA updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: FOSA not found
 *   delete:
 *     summary: Delete a FOSA
 *     tags: [FOSA]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: FOSA deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: FOSA not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("manager", "admin", "super_admin"),
  upload.single("image"),
  FosaController.validation,
  validate,
  controller.update,
)

router.delete("/:id", authenticate, authorize("admin", "super_admin"), controller.delete)

export default router
