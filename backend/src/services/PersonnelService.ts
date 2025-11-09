import { BaseService } from "./BaseService"
import { Personnel } from "../models/Personnel"

export class PersonnelService extends BaseService<Personnel> {
  constructor() {
    super(Personnel)
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [
        { association: "fosa" },
        { association: "categorie" },
      ],
    })
  }

  async getByFosa(fosaId: number) {
    return await this.findAll({
      where: { fosaId },
      include: [{ association: "categorie" }],
    })
  }

  async getByCategorie(categorieId: number) {
    return await this.findAll({
      where: { categorieId },
      include: [{ association: "fosa" }],
    })
  }
}
