import { BaseService } from "./BaseService"
import { Region } from "../models/Region"

export class RegionService extends BaseService<Region> {
  constructor() {
    super(Region)
  }

  async getWithDepartements(id: number) {
    return await this.findById(id, {
      include: [{ association: "departements" }, { association: "districts" }],
    })
  }

  // Override getById pour inclure les données de la carte
  async findById(id: number, options?: any) {
    const defaultOptions = {
      attributes: ["id", "nom", "code", "geom"],
      include: [
        {
          association: "districts",
          required: false,
          attributes: ["id", "nom_ds", "code_ds", "geom"],
          include: [
            {
              association: "airesantes",
              required: false,
              attributes: ["id", "nom_as", "code_as", "geom"],
              include: [
                {
                  association: "fosas",
                  required: false,
                  attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme"],
                },
              ],
            },
          ],
        },
      ],
    };

    return await super.findById(id, options || defaultOptions);
  }

  // Méthodes spécifiques pour la carte (avec geom et jointures spatiales)
  async getAllForMap(limit?: number, offset?: number) {
    const options: any = {
      attributes: ["id", "nom", "code", "geom"],
      include: [
        {
          association: "districts",
          required: false, // LEFT JOIN
          attributes: ["id", "nom_ds", "code_ds", "geom"],
          include: [
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
      attributes: ["id", "nom", "code", "geom"],
      include: [
        {
          association: "districts",
          required: false, // LEFT JOIN
          attributes: ["id", "nom_ds", "code_ds", "geom"],
          include: [
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
        },
      ],
    });
  }
}
