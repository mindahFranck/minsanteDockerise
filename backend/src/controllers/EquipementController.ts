import { BaseController } from "./BaseController"
import { EquipementService } from "../services/EquipementService"
import { body } from "express-validator"

export class EquipementController extends BaseController<any> {
  constructor() {
    super(new EquipementService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("fosaId").notEmpty().isInt().withMessage("FOSA ID is required and must be an integer"),
    body("type").optional().isString().withMessage("Type must be a string"),
    body("quantite").optional().isInt({ min: 0 }).withMessage("Quantite must be a positive integer"),
    body("etat").optional().isIn(["Bon", "Moyen", "Mauvais", "Hors service"]).withMessage("Invalid etat value"),
    body("dateAcquisition").optional().isISO8601().withMessage("Invalid date format"),
  ]
}
