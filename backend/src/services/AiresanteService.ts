import { BaseService } from "./BaseService";
import { Airesante } from "../models/Airesante";

export class AiresanteService extends BaseService<Airesante> {
  constructor() {
    super(Airesante);
  }

  // Override paginate to exclude geom field for performance
  async paginate(page: number = 1, limit?: number, options?: any) {
    const modifiedOptions = {
      ...options,
      attributes: {
        exclude: ["geom"], // Exclure le champ géométrie pour optimiser les performances
      },
    };
    return await super.paginate(page, limit, modifiedOptions);
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      attributes: { exclude: ["geom"] },
      include: [
        { association: "arrondissement" },
        { association: "district" },
        { association: "fosas" },
      ],
    });
  }

  // Override findById pour inclure les données de la carte avec jointures spatiales
  async findById(id: number, options?: any) {
    const defaultOptions = {
      attributes: ["id", "nom_as", "nom_dist", "code_as", "area", "geom", "districtId"],
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
        {
          association: "fosas",
          required: false,
          attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme", "situation"],
        },
      ],
    };

    return await super.findById(id, options || defaultOptions);
  }

  async getByArrondissement(arrondissementId: number) {
    return await this.findAll({
      where: { arrondissementId },
      attributes: { exclude: ["geom"] },
      include: [{ association: "fosas" }],
    });
  }

  async getByDistrict(districtId: number) {
    return await this.findAll({
      where: { districtId },
      attributes: { exclude: ["geom"] },
      include: [{ association: "fosas" }],
    });
  }

  // Méthodes spécifiques pour la carte (avec geom et jointures spatiales)
  async getAllForMap(limit?: number, offset?: number) {
    const options: any = {
      attributes: [
        "id",
        "nom_as",
        "nom_dist",
        "code_as",
        "area",
        "geom",
        "districtId",
      ],
      include: [
        {
          association: "district",
          required: true, // INNER JOIN
          attributes: ["id", "nom_ds", "code_ds", "region", "geom"],
        },
        {
          association: "fosas",
          required: false, // LEFT JOIN pour les FOSAs (certaines aires peuvent ne pas avoir de FOSAs)
          attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme"],
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
      attributes: [
        "id",
        "nom_as",
        "nom_dist",
        "code_as",
        "area",
        "geom",
        "districtId",
      ],
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
        {
          association: "fosas",
          required: false, // LEFT JOIN
          attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme", "situation"],
        },
      ],
    });
  }

  async getByDistrictForMap(districtId: number) {
    return await this.findAll({
      where: { districtId },
      attributes: [
        "id",
        "nom_as",
        "nom_dist",
        "code_as",
        "area",
        "geom",
        "districtId",
      ],
      include: [
        {
          association: "district",
          required: true, // INNER JOIN
          attributes: ["id", "nom_ds", "code_ds", "region", "geom"],
        },
        {
          association: "fosas",
          required: false, // LEFT JOIN
          attributes: ["id", "nom", "type", "latitude", "longitude", "estFerme"],
        },
      ],
    });
  }
}
