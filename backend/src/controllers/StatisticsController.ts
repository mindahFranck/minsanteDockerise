import type { Response, NextFunction } from "express"
import type { AuthRequest } from "../types"
import { StatisticsService } from "../services/StatisticsService"
import { asyncHandler } from "../utils/asyncHandler"

export class StatisticsController {
  private statisticsService: StatisticsService

  constructor() {
    this.statisticsService = new StatisticsService()
  }

  /**
   * @swagger
   * /statistics/overview:
   *   get:
   *     summary: Get system overview statistics
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Overview statistics retrieved successfully
   */
  getOverview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stats = await this.statisticsService.getOverview()
    res.json({
      success: true,
      data: stats,
    })
  })

  /**
   * @swagger
   * /statistics/fosas:
   *   get:
   *     summary: Get FOSA statistics
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: FOSA statistics retrieved successfully
   */
  getFosaStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stats = await this.statisticsService.getFosaStatistics()
    res.json({
      success: true,
      data: stats,
    })
  })

  /**
   * @swagger
   * /statistics/personnel:
   *   get:
   *     summary: Get personnel statistics
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Personnel statistics retrieved successfully
   */
  getPersonnelStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stats = await this.statisticsService.getPersonnelStatistics()
    res.json({
      success: true,
      data: stats,
    })
  })

  /**
   * @swagger
   * /statistics/equipment:
   *   get:
   *     summary: Get equipment statistics
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Equipment statistics retrieved successfully
   */
  getEquipmentStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stats = await this.statisticsService.getEquipmentStatistics()
    res.json({
      success: true,
      data: stats,
    })
  })

  /**
   * @swagger
   * /statistics/geographic:
   *   get:
   *     summary: Get geographic distribution statistics
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Geographic statistics retrieved successfully
   */
  getGeographicStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stats = await this.statisticsService.getGeographicDistribution()
    res.json({
      success: true,
      data: stats,
    })
  })

  /**
   * @swagger
   * /statistics/buildings:
   *   get:
   *     summary: Get building statistics
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Building statistics retrieved successfully
   */
  getBuildingStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stats = await this.statisticsService.getBuildingStatistics()
    res.json({
      success: true,
      data: stats,
    })
  })

  /**
   * @swagger
   * /statistics/patients:
   *   get:
   *     summary: Get patient statistics
   *     tags: [Statistics]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Patient statistics retrieved successfully
   */
  getPatientStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stats = await this.statisticsService.getPatientStatistics()
    res.json({
      success: true,
      data: stats,
    })
  })
}
