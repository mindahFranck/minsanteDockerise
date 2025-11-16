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

  // Override findById pour inclure les données de la carte avec jointures spatiales
  async findById(id: number, options?: any) {
    const defaultOptions = {
      attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme", "situation", "capaciteLits", "airesanteId", "arrondissementId"],
      include: [
        {
          association: "airesante",
          required: true,
          attributes: ["id", "nom_as", "code_as", "geom"],
          include: [
            {
              association: "district",
              required: true,
              attributes: ["id", "nom_ds", "code_ds", "region", "geom"],
              include: [
                {
                  association: "region",
                  required: true,
                  attributes: ["id", "nom", "code", "geom"],
                },
              ],
            },
          ],
        },
        {
          association: "arrondissement",
          required: true,
          attributes: ["id", "nom", "geom"],
        },
      ],
    };

    return await super.findById(id, options || defaultOptions);
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

  // Méthodes spécifiques pour la carte (avec jointures spatiales)
  async getAllForMap(limit?: number, offset?: number) {
    const options: any = {
      attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme", "situation", "airesanteId", "arrondissementId"],
      include: [
        {
          association: "airesante",
          required: true, // INNER JOIN - toujours avoir une aire de santé
          attributes: ["id", "nom_as", "code_as", "geom"],
          include: [
            {
              association: "district",
              required: true, // INNER JOIN - toujours avoir un district
              attributes: ["id", "nom_ds", "code_ds", "region", "geom"],
            },
          ],
        },
        {
          association: "arrondissement",
          required: true, // INNER JOIN - toujours avoir un arrondissement
          attributes: ["id", "nom", "geom"],
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
      attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme", "situation", "capaciteLits", "airesanteId", "arrondissementId"],
      include: [
        {
          association: "airesante",
          required: true, // INNER JOIN
          attributes: ["id", "nom_as", "code_as", "geom"],
          include: [
            {
              association: "district",
              required: true, // INNER JOIN
              attributes: ["id", "nom_ds", "code_ds", "region", "geom"],
              include: [
                {
                  association: "region",
                  required: true, // INNER JOIN
                  attributes: ["id", "nom", "code", "geom"],
                },
              ],
            },
          ],
        },
        {
          association: "arrondissement",
          required: true, // INNER JOIN
          attributes: ["id", "nom", "geom"],
        },
      ],
    });
  }

  async getByAiresanteForMap(airesanteId: number) {
    return await this.findAll({
      where: { airesanteId },
      attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme", "situation"],
      include: [
        {
          association: "airesante",
          required: true, // INNER JOIN
          attributes: ["id", "nom_as", "code_as", "geom"],
        },
        {
          association: "arrondissement",
          required: true, // INNER JOIN
          attributes: ["id", "nom", "geom"],
        },
      ],
    });
  }
}
