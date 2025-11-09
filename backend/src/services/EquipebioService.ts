import { BaseService } from "./BaseService"
import { Equipebio } from "../models/Equipebio"

export class EquipebioService extends BaseService<Equipebio> {
  constructor() {
    super(Equipebio)
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
