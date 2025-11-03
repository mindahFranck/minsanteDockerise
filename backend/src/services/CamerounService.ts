import { BaseService } from "./BaseService"
import Cameroun from "../models/Cameroun"

export class CamerounService extends BaseService<any> {
  constructor() {
    super(Cameroun as any)
  }
}
