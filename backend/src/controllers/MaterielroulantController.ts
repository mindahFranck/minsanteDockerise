import { BaseController } from "./BaseController"
import { MaterielroulantService } from "../services/MaterielroulantService"
import { body } from "express-validator"

export class MaterielroulantController extends BaseController<any> {
  constructor() {
    super(new MaterielroulantService())
  }

  static validation = [
    body("nom").optional().isString().withMessage("Name must be a string"),
    body("fosaId").notEmpty().isInt().withMessage("FOSA ID is required and must be an integer"),
    body("type").optional().isString().withMessage("Type must be a string"),
    body("numeroChassis").optional().isString().withMessage("Numero chassis must be a string"),
    body("marque").optional().isString().withMessage("Marque must be a string"),
    body("modele").optional().isString().withMessage("Modele must be a string"),
    body("annee").optional().isInt({ min: 1900, max: 2100 }).withMessage("Invalid year"),
    body("immatriculation").optional().isString().withMessage("Immatriculation must be a string"),
    body("etat").optional().isIn(["Bon", "Moyen", "Mauvais", "Hors service"]).withMessage("Invalid etat value"),
    body("dateAcquisition").optional().isISO8601().withMessage("Invalid date format"),
  ]
}
