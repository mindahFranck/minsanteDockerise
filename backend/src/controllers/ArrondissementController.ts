import { BaseController } from "./BaseController"
import { ArrondissementService } from "../services/ArrondissementService"
import { body } from "express-validator"

export class ArrondissementController extends BaseController<any> {
  constructor() {
    super(new ArrondissementService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("departementId").notEmpty().isInt().withMessage("Departement ID is required and must be an integer"),
    body("population").optional().isInt({ min: 0 }).withMessage("Population must be a positive integer"),
  ]
}
