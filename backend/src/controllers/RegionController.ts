import { BaseController } from "./BaseController"
import { RegionService } from "../services/RegionService"
import { body } from "express-validator"

export class RegionController extends BaseController<any> {
  constructor() {
    super(new RegionService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("population").optional().isInt({ min: 0 }).withMessage("Population must be a positive integer"),
  ]
}
