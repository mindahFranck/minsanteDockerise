import { BaseController } from "./BaseController"
import { DistrictService } from "../services/DistrictService"
import { body } from "express-validator"

export class DistrictController extends BaseController<any> {
  constructor() {
    super(new DistrictService())
  }

  static validation = [
    body("nom").notEmpty().withMessage("Name is required"),
    body("regionId").notEmpty().isInt().withMessage("Region ID is required and must be an integer"),
    body("population").optional().isInt({ min: 0 }).withMessage("Population must be a positive integer"),
    body("chefLieu").optional().isString().withMessage("Chef-lieu must be a string"),
  ]
}
