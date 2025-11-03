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
