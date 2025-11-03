import { BaseService } from "./BaseService"
import { Arrondissement } from "../models/Arrondissement"

export class ArrondissementService extends BaseService<Arrondissement> {
  constructor() {
    super(Arrondissement)
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [
        { association: "departement" },
        { association: "airesantes" },
        { association: "fosas" },
      ],
    })
  }

  async getByDepartement(departementId: number) {
    return await this.findAll({
      where: { departementId },
      include: [{ association: "airesantes" }],
    })
  }
}
