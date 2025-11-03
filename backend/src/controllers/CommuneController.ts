import { BaseController } from "./BaseController"
import { CommuneService } from "../services/CommuneService"
import { body } from "express-validator"

export class CommuneController extends BaseController<any> {
  constructor() {
    super(new CommuneService())
  }

  static validation = [
    body("commune").notEmpty().withMessage("Commune name is required"),
    body("departementId").notEmpty().isInt().withMessage("Departement ID is required"),
  ]
}
