import { BaseController } from "./BaseController"
import { PersonnelService } from "../services/PersonnelService"
import { body } from "express-validator"

export class PersonnelController extends BaseController<any> {
  constructor() {
    super(new PersonnelService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("prenom").notEmpty().withMessage("Prenom is required"),
    body("fosaId").notEmpty().isInt().withMessage("FOSA ID is required and must be an integer"),
    body("serviceId").optional().isInt().withMessage("Service ID must be an integer"),
    body("categorieId").optional().isInt().withMessage("Categorie ID must be an integer"),
    body("specialite").optional().isString().withMessage("Specialite must be a string"),
    body("telephone").optional().isString().withMessage("Telephone must be a string"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("dateEmbauche").optional().isISO8601().withMessage("Invalid date format"),
  ]
}
