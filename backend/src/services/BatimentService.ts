import { BaseService } from "./BaseService"
import { Batiment } from "../models/Batiment"

export class BatimentService extends BaseService<Batiment> {
  constructor() {
    super(Batiment)
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [
        { association: "fosa" },
        { association: "services" },
      ],
    })
  }

  async getByFosa(fosaId: number) {
    return await this.findAll({
      where: { fosaId },
      include: [{ association: "services" }],
    })
  }
}
