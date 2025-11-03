import { BaseController } from "./BaseController"
import { DepartementService } from "../services/DepartementService"
import { body } from "express-validator"

export class DepartementController extends BaseController<any> {
  constructor() {
    super(new DepartementService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("regionId").notEmpty().isInt().withMessage("Region ID is required and must be an integer"),
    body("population").optional().isInt({ min: 0 }).withMessage("Population must be a positive integer"),
  ]
}
