import { BaseService } from "./BaseService"
import { Parametre } from "../models/Parametre"

export class ParametreService extends BaseService<Parametre> {
  constructor() {
    super(Parametre)
  }

  async getByKey(cle: string) {
    return await this.findOne({ cle })
  }

  async getByCategorie(categorie: string) {
    return await this.findAll({
      where: { categorie },
    })
  }

  async updateByKey(cle: string, valeur: string, userId?: number) {
    const parametre = await this.findOne({ cle })
    if (!parametre) {
      throw new Error(`Parameter with key ${cle} not found`)
    }
    return await this.update(parametre.id, { valeur }, userId)
  }
}
