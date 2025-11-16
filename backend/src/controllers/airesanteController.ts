import { BaseController } from "./BaseController"
import { AiresanteService } from "../services/AiresanteService"
import { body } from "express-validator"
import { asyncHandler } from "../utils/asyncHandler"
import type { AuthRequest } from "../types"
import type { Response, NextFunction } from "express"

export class AiresanteController extends BaseController<any> {
  private airesanteService: AiresanteService

  constructor() {
    const service = new AiresanteService()
    super(service)
    this.airesanteService = service
  }

  // Routes spécifiques pour la carte (avec geom)
  getAllForMap = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const limit = req.query.limit ? Number.parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? Number.parseInt(req.query.offset as string) : undefined;

    const airesantes = await this.airesanteService.getAllForMap(limit, offset)
    res.json({
      success: true,
      data: airesantes,
      pagination: limit !== undefined ? {
        limit,
        offset: offset || 0,
        total: airesantes.length
      } : undefined
    })
  })

  getByIdForMap = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = Number.parseInt(req.params.id)
    const airesante = await this.airesanteService.getByIdForMap(id)
    res.json({
      success: true,
      data: airesante,
    })
  })

  getByDistrictForMap = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const districtId = Number.parseInt(req.params.districtId)
    const airesantes = await this.airesanteService.getByDistrictForMap(districtId)
    res.json({
      success: true,
      data: airesantes,
    })
  })

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("arrondissementId").optional().isInt().withMessage("Arrondissement ID must be an integer"),
    body("districtId").optional().isInt().withMessage("District ID must be an integer"),
    body("population").optional().isInt({ min: 0 }).withMessage("Population must be a positive integer"),
  ]
}
