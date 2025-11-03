import { BaseService } from "./BaseService"
import { Materielroulant } from "../models/Materielroulant"

export class MaterielroulantService extends BaseService<Materielroulant> {
  constructor() {
    super(Materielroulant)
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [{ association: "fosa" }],
    })
  }

  async getByFosa(fosaId: number) {
    return await this.findAll({
      where: { fosaId },
    })
  }

  async getByEtat(etat: string) {
    return await this.findAll({
      where: { etat },
      include: [{ association: "fosa" }],
    })
  }

  async getByType(type: string) {
    return await this.findAll({
      where: { type },
      include: [{ association: "fosa" }],
    })
  }
}
