import { BaseController } from "./BaseController"
import { EquipementService } from "../services/EquipementService"
import { body } from "express-validator"

export class EquipementController extends BaseController<any> {
  constructor() {
    super(new EquipementService())
  }

  static validation = [
    body("nom").optional().isString().withMessage("Name must be a string"),
    body("serviceId").notEmpty().isInt().withMessage("Service ID is required and must be an integer"),
    body("type").optional().isString().withMessage("Type must be a string"),
    body("quantite").optional().isInt({ min: 0 }).withMessage("Quantite must be a positive integer"),
    body("etat").optional().isIn(["Bon", "Moyen", "Mauvais", "Hors service"]).withMessage("Invalid etat value"),
    body("dateAcquisition").optional().isISO8601().withMessage("Invalid date format"),
  ]
}
