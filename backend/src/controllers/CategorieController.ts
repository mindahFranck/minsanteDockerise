import { BaseController } from "./BaseController"
import { CategorieService } from "../services/CategorieService"
import { body } from "express-validator"

export class CategorieController extends BaseController<any> {
  constructor() {
    super(new CategorieService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("description").optional().isString().withMessage("Description must be a string"),
  ]
}
