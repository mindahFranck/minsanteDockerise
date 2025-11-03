import { BaseController } from "./BaseController"
import { DegradationService } from "../services/DegradationService"
import { body } from "express-validator"

export class DegradationController extends BaseController<any> {
  constructor() {
    super(new DegradationService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("type").optional().isString().withMessage("Type must be a string"),
  ]
}
