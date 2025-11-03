import { BaseService } from "./BaseService"
import { Degradation } from "../models/Degradation"

export class DegradationService extends BaseService<Degradation> {
  constructor() {
    super(Degradation)
  }

  async getByType(type: string) {
    return await this.findAll({
      where: { type },
    })
  }
}
