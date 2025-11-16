import { BaseService } from "./BaseService"
import { Region } from "../models/Region"
import sequelize from "../config/database"
import { QueryTypes } from "sequelize"

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

  // Méthode avec vraie jointure spatiale PostGIS
  async getByIdWithSpatialJoin(regionId: number) {
    const query = `
      SELECT
        r.id as region_id,
        r.nom as region_nom,
        r.code as region_code,
        ST_AsGeoJSON(r.geom) as region_geojson,
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code,
        ST_AsGeoJSON(d.geom) as district_geojson,
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.code_as as airesante_code,
        ST_AsGeoJSON(a.geom) as airesante_geojson,
        f.id as fosa_id,
        f.nom as fosa_nom,
        f.type as fosa_type,
        f.latitude,
        f.longitude,
        f.est_ferme,
        f.situation
      FROM regions r
      LEFT JOIN districts d ON ST_Within(d.geom, r.geom) OR d.region_id = r.id
      LEFT JOIN airesantes a ON ST_Within(a.geom, d.geom) OR a.district_id = d.id
      LEFT JOIN fosas f ON ST_DWithin(
        ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
        a.geom,
        0.1
      ) OR f.airesante_id = a.id
      WHERE r.id = :regionId
      ORDER BY d.id, a.id, f.id
    `;

    const results = await sequelize.query(query, {
      replacements: { regionId },
      type: QueryTypes.SELECT,
    });

    return this.formatSpatialResults(results);
  }

  private formatSpatialResults(results: any[]) {
    if (results.length === 0) return null;

    const region: any = {
      id: results[0].region_id,
      nom: results[0].region_nom,
      code: results[0].region_code,
      geojson: results[0].region_geojson ? JSON.parse(results[0].region_geojson) : null,
      districts: [],
    };

    const districtsMap = new Map();
    const airesantesMap = new Map();

    results.forEach((row) => {
      if (row.district_id && !districtsMap.has(row.district_id)) {
        const district = {
          id: row.district_id,
          nom: row.district_nom,
          code: row.district_code,
          geojson: row.district_geojson ? JSON.parse(row.district_geojson) : null,
          airesantes: [],
        };
        districtsMap.set(row.district_id, district);
        region.districts.push(district);
      }

      if (row.airesante_id && !airesantesMap.has(row.airesante_id)) {
        const airesante = {
          id: row.airesante_id,
          nom: row.airesante_nom,
          code: row.airesante_code,
          geojson: row.airesante_geojson ? JSON.parse(row.airesante_geojson) : null,
          fosas: [],
        };
        airesantesMap.set(row.airesante_id, airesante);

        const district = districtsMap.get(row.district_id);
        if (district) {
          district.airesantes.push(airesante);
        }
      }

      if (row.fosa_id) {
        const airesante = airesantesMap.get(row.airesante_id);
        if (airesante) {
          const fosaExists = airesante.fosas.some((f: any) => f.id === row.fosa_id);
          if (!fosaExists) {
            airesante.fosas.push({
              id: row.fosa_id,
              nom: row.fosa_nom,
              type: row.fosa_type,
              latitude: row.latitude,
              longitude: row.longitude,
              estFerme: row.est_ferme,
              situation: row.situation,
            });
          }
        }
      }
    });

    return region;
  }
}
