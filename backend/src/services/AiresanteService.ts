import { BaseService } from "./BaseService"
import { Airesante } from "../models/Airesante"

export class AiresanteService extends BaseService<Airesante> {
  constructor() {
    super(Airesante)
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [
        { association: "arrondissement" },
        { association: "district" },
        { association: "fosas" },
      ],
    })
  }

  async getByArrondissement(arrondissementId: number) {
    return await this.findAll({
      where: { arrondissementId },
      include: [{ association: "fosas" }],
    })
  }

  async getByDistrict(districtId: number) {
    return await this.findAll({
      where: { districtId },
      include: [{ association: "fosas" }],
    })
  }
}
