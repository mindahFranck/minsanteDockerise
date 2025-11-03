import { BaseController } from "./BaseController"
import { AiresanteService } from "../services/AiresanteService"
import { body } from "express-validator"

export class AiresanteController extends BaseController<any> {
  constructor() {
    super(new AiresanteService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("arrondissementId").optional().isInt().withMessage("Arrondissement ID must be an integer"),
    body("districtId").optional().isInt().withMessage("District ID must be an integer"),
    body("population").optional().isInt({ min: 0 }).withMessage("Population must be a positive integer"),
  ]
}
