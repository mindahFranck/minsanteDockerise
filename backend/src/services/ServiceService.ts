import { BaseService } from "./BaseService"
import { Service } from "../models/Service"

export class ServiceService extends BaseService<Service> {
  constructor() {
    super(Service)
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [
        { association: "batiment" },
        { association: "equipements" },
        { association: "equipebios" },
      ],
    })
  }

  async getByBatiment(batimentId: number) {
    return await this.findAll({
      where: { batimentId },
      include: [
        { association: "equipements" },
        { association: "equipebios" },
      ],
    })
  }
}
