import { BaseService } from "./BaseService"
import Commune from "../models/Commune"

export class CommuneService extends BaseService<typeof Commune> {
  constructor() {
    super(Commune)
  }
}
