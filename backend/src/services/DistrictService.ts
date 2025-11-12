import { BaseService } from "./BaseService"
import { District } from "../models/District"

export class DistrictService extends BaseService<District> {
  constructor() {
    super(District)
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
        { association: "region" },
        { association: "airesantes" },
      ],
    })
  }

  async getByRegion(regionId: number) {
    return await this.findAll({
      where: { regionId },
      attributes: { exclude: ['geom'] },
      include: [{ association: "airesantes" }],
    })
  }
}
