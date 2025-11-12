import { BaseService } from "./BaseService"
import { Airesante } from "../models/Airesante"

export class AiresanteService extends BaseService<Airesante> {
  constructor() {
    super(Airesante)
  }

  // Override paginate to exclude geom field for performance
  async paginate(
    page: number = 1,
    limit?: number,
    options?: any
  ) {
    const modifiedOptions = {
      ...options,
      attributes: {
        exclude: ['geom'] // Exclure le champ géométrie pour optimiser les performances
      }
    };
    return await super.paginate(page, limit, modifiedOptions);
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      attributes: { exclude: ['geom'] },
      include: [
        { association: "arrondissement" },
        { association: "district" },
        { association: "fosas" },
      ],
    })
  }

  async getByArrondissement(arrondissementId: number) {
    return await this.findAll({
      where: { arrondissementId },
      attributes: { exclude: ['geom'] },
      include: [{ association: "fosas" }],
    })
  }

  async getByDistrict(districtId: number) {
    return await this.findAll({
      where: { districtId },
      attributes: { exclude: ['geom'] },
      include: [{ association: "fosas" }],
    })
  }

  // Méthodes spécifiques pour la carte (avec geom)
  async getAllForMap() {
    return await this.findAll({
      attributes: ['id', 'nom_aire', 'code_aire', 'geom', 'districtId']
    })
  }

  async getByIdForMap(id: number) {
    return await this.findById(id, {
      attributes: ['id', 'nom_aire', 'code_aire', 'geom', 'districtId']
    })
  }

  async getByDistrictForMap(districtId: number) {
    return await this.findAll({
      where: { districtId },
      attributes: ['id', 'nom_aire', 'code_aire', 'geom', 'districtId']
    })
  }
}
