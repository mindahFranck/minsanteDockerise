import { BaseService } from "./BaseService"
import Commune from "../models/Commune"

export class CommuneService extends BaseService<any> {
  constructor() {
    super(Commune as any)
  }
}
