import { BaseService } from "./BaseService"
import { Equipebio } from "../models/Equipebio"

export class EquipebioService extends BaseService<Equipebio> {
  constructor() {
    super(Equipebio)
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
}
