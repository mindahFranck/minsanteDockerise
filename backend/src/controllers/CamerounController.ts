import { BaseController } from "./BaseController"
import { CamerounService } from "../services/CamerounService"

export class CamerounController extends BaseController<any> {
  constructor() {
    super(new CamerounService())
  }
}
