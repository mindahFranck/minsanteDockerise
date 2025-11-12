import { BaseController } from "./BaseController"
import { DistrictService } from "../services/DistrictService"
import { body } from "express-validator"
import { asyncHandler } from "../utils/asyncHandler"
import type { AuthRequest } from "../types"
import type { Response, NextFunction } from "express"

export class DistrictController extends BaseController<any> {
  private districtService: DistrictService

  constructor() {
    const service = new DistrictService()
    super(service)
    this.districtService = service
  }

  // Routes spécifiques pour la carte (avec geom)
  getAllForMap = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const districts = await this.districtService.getAllForMap()
    res.json({
      success: true,
      data: districts,
    })
  })

  getByIdForMap = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = Number.parseInt(req.params.id)
    const district = await this.districtService.getByIdForMap(id)
    res.json({
      success: true,
      data: district,
    })
  })

  getByRegionForMap = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const regionId = Number.parseInt(req.params.regionId)
    const districts = await this.districtService.getByRegionForMap(regionId)
    res.json({
      success: true,
      data: districts,
    })
  })

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("regionId").notEmpty().isInt().withMessage("Region ID is required and must be an integer"),
    body("population").optional().isInt({ min: 0 }).withMessage("Population must be a positive integer"),
    body("chefLieu").optional().isString().withMessage("Chef-lieu must be a string"),
  ]
}
