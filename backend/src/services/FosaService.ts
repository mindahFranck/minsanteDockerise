import { BaseService } from "./BaseService"
import { Fosa } from "../models/Fosa"

export class FosaService extends BaseService<Fosa> {
  constructor() {
    super(Fosa)
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [
        { association: "arrondissement" },
        { association: "airesante" },
        { association: "batiments" },
        { association: "personnels" },
        { association: "materielroulants" },
        { association: "parametres" },
      ],
    })
  }

  async getByType(type: string) {
    return await this.findAll({
      where: { type },
    })
  }

  async getClosedFosas() {
    return await this.findAll({
      where: { estFerme: true },
    })
  }
}
