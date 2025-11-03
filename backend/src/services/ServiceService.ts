import { BaseService } from "./BaseService"
import { Service } from "../models/Service"

export class ServiceService extends BaseService<Service> {
  constructor() {
    super(Service)
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [
        { association: "fosa" },
        { association: "batiment" },
        { association: "personnels" },
      ],
    })
  }

  async getByFosa(fosaId: number) {
    return await this.findAll({
      where: { fosaId },
      include: [{ association: "batiment" }, { association: "personnels" }],
    })
  }

  async getByBatiment(batimentId: number) {
    return await this.findAll({
      where: { batimentId },
      include: [{ association: "personnels" }],
    })
  }
}
