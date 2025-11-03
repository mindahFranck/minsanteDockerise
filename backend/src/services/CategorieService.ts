import { BaseService } from "./BaseService"
import { Categorie } from "../models/Categorie"

export class CategorieService extends BaseService<Categorie> {
  constructor() {
    super(Categorie)
  }

  async getWithPersonnels(id: number) {
    return await this.findById(id, {
      include: [{ association: "personnels" }],
    })
  }
}
