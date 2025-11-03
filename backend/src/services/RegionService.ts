import { BaseService } from "./BaseService"
import { Region } from "../models/Region"

export class RegionService extends BaseService<Region> {
  constructor() {
    super(Region)
  }

  async getWithDepartements(id: number) {
    return await this.findById(id, {
      include: [{ association: "departements" }, { association: "districts" }],
    })
  }
}
