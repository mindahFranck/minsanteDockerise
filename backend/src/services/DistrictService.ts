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

  // Méthodes spécifiques pour la carte (avec geom et jointures spatiales)
  async getAllForMap(limit?: number, offset?: number) {
    const options: any = {
      attributes: ['id', 'nom_ds', 'code_ds', 'region', 'geom', 'regionId'],
      include: [
        {
          association: "region",
          required: true, // INNER JOIN
          attributes: ["id", "nom", "code", "geom"],
        },
        {
          association: "airesantes",
          required: false, // LEFT JOIN pour les aires de santé
          attributes: ["id", "nom_as", "code_as", "geom"],
          include: [
            {
              association: "fosas",
              required: false, // LEFT JOIN pour les FOSAs
              attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme"],
            },
          ],
        },
      ],
    };

    if (limit !== undefined) {
      options.limit = limit;
    }

    if (offset !== undefined) {
      options.offset = offset;
    }

    return await this.findAll(options);
  }

  async getByIdForMap(id: number) {
    return await this.findById(id, {
      attributes: ['id', 'nom_ds', 'code_ds', 'region', 'geom', 'regionId'],
      include: [
        {
          association: "region",
          required: true, // INNER JOIN
          attributes: ["id", "nom", "code", "geom"],
        },
        {
          association: "airesantes",
          required: false, // LEFT JOIN
          attributes: ["id", "nom_as", "code_as", "geom"],
          include: [
            {
              association: "fosas",
              required: false, // LEFT JOIN
              attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme", "situation"],
            },
          ],
        },
      ],
    })
  }

  async getByRegionForMap(regionId: number) {
    return await this.findAll({
      where: { regionId },
      attributes: ['id', 'nom_ds', 'code_ds', 'region', 'geom', 'regionId'],
      include: [
        {
          association: "region",
          required: true, // INNER JOIN
          attributes: ["id", "nom", "code", "geom"],
        },
        {
          association: "airesantes",
          required: false, // LEFT JOIN
          attributes: ["id", "nom_as", "code_as", "geom"],
          include: [
            {
              association: "fosas",
              required: false, // LEFT JOIN
              attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme"],
            },
          ],
        },
      ],
    })
  }
}
