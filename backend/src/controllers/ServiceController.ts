import { BaseController } from "./BaseController"
import { ServiceService } from "../services/ServiceService"
import { body } from "express-validator"

export class ServiceController extends BaseController<any> {
  constructor() {
    super(new ServiceService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("fosaId").notEmpty().isInt().withMessage("FOSA ID is required and must be an integer"),
    body("batimentId").optional().isInt().withMessage("Batiment ID must be an integer"),
    body("capacite").optional().isInt({ min: 0 }).withMessage("Capacite must be a positive integer"),
    body("description").optional().isString().withMessage("Description must be a string"),
  ]
}
