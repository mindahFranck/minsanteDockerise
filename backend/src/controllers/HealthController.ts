import type { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import sequelize from "../config/database"
import { redis } from "../config/redis"
import { successResponse } from "../utils/response"

export class HealthController {
  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service health status
   */
  static check = asyncHandler(async (req: Request, res: Response) => {
    const health = {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      status: "healthy",
      services: {
        database: "unknown",
        redis: "unknown",
      },
    }

    // Check database
    try {
      await sequelize.authenticate()
      health.services.database = "connected"
    } catch (error) {
      health.services.database = "disconnected"
      health.status = "unhealthy"
    }

    // Check Redis
    try {
      await redis.ping()
      health.services.redis = "connected"
    } catch (error) {
      health.services.redis = "disconnected"
    }

    const statusCode = health.status === "healthy" ? 200 : 503
    return successResponse(res, health, "Health check completed", statusCode)
  })

  /**
   * @swagger
   * /health/ready:
   *   get:
   *     summary: Readiness check
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is ready
   */
  static ready = asyncHandler(async (req: Request, res: Response) => {
    try {
      await sequelize.authenticate()
      return successResponse(res, { ready: true }, "Service is ready")
    } catch (error) {
      return res.status(503).json({ ready: false, error: "Service not ready" })
    }
  })

  /**
   * @swagger
   * /health/live:
   *   get:
   *     summary: Liveness check
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is alive
   */
  static live = asyncHandler(async (req: Request, res: Response) => {
    return successResponse(res, { alive: true }, "Service is alive")
  })
}
