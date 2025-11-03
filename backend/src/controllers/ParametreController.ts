import { BaseController } from "./BaseController"
import { ParametreService } from "../services/ParametreService"
import { body } from "express-validator"

export class ParametreController extends BaseController<any> {
  constructor() {
    super(new ParametreService())
  }

  static validation = [
    body("cle").notEmpty().withMessage("Key is required"),
    body("valeur").notEmpty().withMessage("Value is required"),
    body("categorie").optional().isString().withMessage("Categorie must be a string"),
    body("description").optional().isString().withMessage("Description must be a string"),
  ]
}
