import { BaseController } from "./BaseController"
import { MaterielroulantService } from "../services/MaterielroulantService"
import { body } from "express-validator"

export class MaterielroulantController extends BaseController<any> {
  constructor() {
    super(new MaterielroulantService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("fosaId").notEmpty().isInt().withMessage("FOSA ID is required and must be an integer"),
    body("type").optional().isIn(["Ambulance", "Véhicule de service", "Moto", "Autre"]).withMessage("Invalid type value"),
    body("marque").optional().isString().withMessage("Marque must be a string"),
    body("modele").optional().isString().withMessage("Modele must be a string"),
    body("immatriculation").optional().isString().withMessage("Immatriculation must be a string"),
    body("anneeFabrication").optional().isInt({ min: 1900, max: 2100 }).withMessage("Invalid fabrication year"),
    body("etat").optional().isIn(["Bon", "Moyen", "Mauvais", "Hors service"]).withMessage("Invalid etat value"),
    body("dateAcquisition").optional().isISO8601().withMessage("Invalid date format"),
  ]
}
