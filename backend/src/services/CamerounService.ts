import { BaseService } from "./BaseService"
import Cameroun from "../models/Cameroun"

export class CamerounService extends BaseService<typeof Cameroun> {
  constructor() {
    super(Cameroun)
  }
}
