import { BaseService } from "./BaseService"
import { District } from "../models/District"

export class DistrictService extends BaseService<District> {
  constructor() {
    super(District)
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [
        { association: "region" },
        { association: "airesantes" },
      ],
    })
  }

  async getByRegion(regionId: number) {
    return await this.findAll({
      where: { regionId },
      include: [{ association: "airesantes" }],
    })
  }
}
