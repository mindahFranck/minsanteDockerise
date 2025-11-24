import { BaseController } from "./BaseController"
import { FosaService } from "../services/FosaService"
import { body } from "express-validator"
import { asyncHandler } from "../utils/asyncHandler"
import type { AuthRequest } from "../types"
import type { Response, NextFunction } from "express"
import fs from "fs/promises"
import path from "path"

export class FosaController extends BaseController<any> {
  private fosaService: FosaService

  constructor() {
    const service = new FosaService()
    super(service)
    this.fosaService = service
  }

  create = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = req.body

    // Add image path if file was uploaded
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`
    }

    const result = await this.fosaService.create(data)

    res.status(201).json({
      success: true,
      data: result,
      message: "FOSA created successfully",
    })
  })

  update = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params
    const data = req.body

    // Get existing FOSA to check for old image
    const existingFosa = await this.fosaService.findById(Number(id))

    // Add new image path if file was uploaded
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`

      // Delete old image if it exists
      if (existingFosa && existingFosa.image) {
        const oldImagePath = path.join(process.cwd(), existingFosa.image)
        try {
          await fs.unlink(oldImagePath)
        } catch (error) {
          console.log("[v0] Failed to delete old image:", error)
        }
      }
    }

    const result = await this.fosaService.update(Number(id), data)

    res.json({
      success: true,
      data: result,
      message: "FOSA updated successfully",
    })
  })

  delete = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params

    // Get FOSA to check for image
    const fosa = await this.fosaService.findById(Number(id))

    // Delete image file if it exists
    if (fosa && fosa.image) {
      const imagePath = path.join(process.cwd(), fosa.image)
      try {
        await fs.unlink(imagePath)
      } catch (error) {
        console.log("[v0] Failed to delete image:", error)
      }
    }

    await this.fosaService.delete(Number(id))

    res.json({
      success: true,
      message: "FOSA deleted successfully",
    })
  })

  getByType = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { type } = req.params
    const fosas = await this.fosaService.getByType(type)

    res.json({
      success: true,
      data: fosas,
    })
  })

  getClosedFosas = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const fosas = await this.fosaService.getClosedFosas()

    res.json({
      success: true,
      data: fosas,
    })
  })

  // Routes spécifiques pour la carte (avec jointures spatiales)
  getAllForMap = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const limit = req.query.limit ? Number.parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? Number.parseInt(req.query.offset as string) : undefined;

    const fosas = await this.fosaService.getAllForMap(limit, offset)
    res.json({
      success: true,
      data: fosas,
      pagination: limit !== undefined ? {
        limit,
        offset: offset || 0,
        total: fosas.length
      } : undefined
    })
  })

  getByIdForMap = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const id = Number.parseInt(req.params.id)
    const fosa = await this.fosaService.getByIdForMap(id)
    res.json({
      success: true,
      data: fosa,
    })
  })

  getByAiresanteForMap = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const airesanteId = Number.parseInt(req.params.airesanteId)
    const fosas = await this.fosaService.getByAiresanteForMap(airesanteId)
    res.json({
      success: true,
      data: fosas,
    })
  })

  // Routes avec vraies jointures spatiales PostGIS
  getFosasByRegionSpatial = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const regionId = Number.parseInt(req.params.regionId)
    const fosas = await this.fosaService.getFosasByRegionSpatial(regionId)
    res.json({
      success: true,
      data: fosas,
      count: fosas.length
    })
  })

  getFosasByDistrictSpatial = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const districtId = Number.parseInt(req.params.districtId)
    const fosas = await this.fosaService.getFosasByDistrictSpatial(districtId)
    res.json({
      success: true,
      data: fosas,
      count: fosas.length
    })
  })

  getFosasByAiresanteSpatial = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const airesanteId = Number.parseInt(req.params.airesanteId)
    const fosas = await this.fosaService.getFosasByAiresanteSpatial(airesanteId)
    res.json({
      success: true,
      data: fosas,
      count: fosas.length
    })
  })

  getFosasByDepartementSpatial = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const departementId = Number.parseInt(req.params.departementId)
    const fosas = await this.fosaService.getFosasByDepartementSpatial(departementId)
    res.json({
      success: true,
      data: fosas,
      count: fosas.length
    })
  })

  getFosasByArrondissementSpatial = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const arrondissementId = Number.parseInt(req.params.arrondissementId)
    const fosas = await this.fosaService.getFosasByArrondissementSpatial(arrondissementId)
    res.json({
      success: true,
      data: fosas,
      count: fosas.length
    })
  })

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("type").optional().isString(),
    body("latitude").optional().isDecimal(),
    body("longitude").optional().isDecimal(),
    body("capaciteLits").optional().isInt({ min: 0 }),
    body("arrondissementId").isInt().withMessage("Arrondissement ID is required"),
    body("airesanteId").isInt().withMessage("Aire de santé ID is required"),
  ]
}
