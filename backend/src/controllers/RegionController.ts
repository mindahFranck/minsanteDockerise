import { BaseController } from "./BaseController"
import { RegionService } from "../services/RegionService"
import { body } from "express-validator"
import { asyncHandler } from "../utils/asyncHandler"
import type { AuthRequest } from "../types"
import type { Response, NextFunction } from "express"

export class RegionController extends BaseController<any> {
  private regionService: RegionService

  constructor() {
    const service = new RegionService()
    super(service)
    this.regionService = service
  }

  // Routes spécifiques pour la carte (avec jointures spatiales)
  getAllForMap = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const limit = req.query.limit ? Number.parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? Number.parseInt(req.query.offset as string) : undefined;

    const regions = await this.regionService.getAllForMap(limit, offset)
    res.json({
      success: true,
      data: regions,
      pagination: limit !== undefined ? {
        limit,
        offset: offset || 0,
        total: regions.length
      } : undefined
    })
  })

  getByIdForMap = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = Number.parseInt(req.params.id)
    const region = await this.regionService.getByIdForMap(id)
    res.json({
      success: true,
      data: region,
    })
  })

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("population").optional().isInt({ min: 0 }).withMessage("Population must be a positive integer"),
  ]
}
