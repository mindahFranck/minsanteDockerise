import { BaseController } from "./BaseController"
import { BatimentService } from "../services/BatimentService"
import { body } from "express-validator"

export class BatimentController extends BaseController<any> {
  constructor() {
    super(new BatimentService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("fosaId").notEmpty().isInt().withMessage("FOSA ID is required and must be an integer"),
    body("superficie").optional().isDecimal().withMessage("Superficie must be a decimal number"),
    body("etat").optional().isIn(["Bon", "Moyen", "Mauvais", "En ruine"]).withMessage("Invalid etat value"),
    body("anneConstruction").optional().isInt({ min: 1800, max: 2100 }).withMessage("Invalid construction year"),
  ]
}
