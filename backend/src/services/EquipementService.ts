import { BaseService } from "./BaseService"
import { Equipement } from "../models/Equipement"

export class EquipementService extends BaseService<Equipement> {
  constructor() {
    super(Equipement)
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [{ association: "service" }],
    })
  }

  async getByService(serviceId: number) {
    return await this.findAll({
      where: { serviceId },
    })
  }
}
