import { BaseService } from "./BaseService"
import { Departement } from "../models/Departement"

export class DepartementService extends BaseService<Departement> {
  constructor() {
    super(Departement)
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [
        { association: "region" },
        { association: "arrondissements" },
        { association: "fosas" },
      ],
    })
  }

  async getByRegion(regionId: number) {
    return await this.findAll({
      where: { regionId },
      include: [{ association: "arrondissements" }],
    })
  }
}
