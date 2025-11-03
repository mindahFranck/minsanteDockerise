import { Router } from "express"
import { AuditController } from "../controllers/AuditController"
import { authenticate } from "../middleware/auth"

const router = Router()
const auditController = new AuditController()

// Toutes les routes nécessitent une authentification
router.use(authenticate)

/**
 * @swagger
 * /audit/users/{userId}:
 *   get:
 *     summary: Get audit history for a specific user
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User audit history retrieved successfully
 */
router.get("/users/:userId", auditController.getUserHistory)

/**
 * @swagger
 * /audit/resources/{resource}/{resourceId}:
 *   get:
 *     summary: Get audit history for a specific resource
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resource
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Resource audit history retrieved successfully
 */
router.get("/resources/:resource/:resourceId", auditController.getResourceHistory)

/**
 * @swagger
 * /audit/recent:
 *   get:
 *     summary: Get recent audit activity (admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 */
router.get("/recent", auditController.getRecentActivity)

/**
 * @swagger
 * /audit/stats:
 *   get:
 *     summary: Get audit statistics (admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit statistics retrieved successfully
 */
router.get("/stats", auditController.getAuditStats)

export default router
