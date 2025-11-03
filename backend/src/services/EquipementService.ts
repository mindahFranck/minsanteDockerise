import { BaseService } from "./BaseService"
import { Equipement } from "../models/Equipement"

export class EquipementService extends BaseService<Equipement> {
  constructor() {
    super(Equipement)
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
