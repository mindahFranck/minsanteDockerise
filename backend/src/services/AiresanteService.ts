import { BaseService } from "./BaseService";
import { Airesante } from "../models/Airesante";
import sequelize from "../config/database";
import { QueryTypes } from "sequelize";

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

  // Méthodes avec vraies jointures spatiales PostGIS (ST_Within, ST_AsGeoJSON)
  async getAllForMap(limit?: number, offset?: number) {
    const limitClause = limit !== undefined ? `LIMIT ${limit}` : '';
    const offsetClause = offset !== undefined ? `OFFSET ${offset}` : '';

    const query = `
      SELECT
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.nom_dist as airesante_nom_dist,
        a.code_as as airesante_code,
        a.area as airesante_area,
        ST_AsGeoJSON(a.geom) as airesante_geojson,
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code,
        d.region as district_region,
        ST_AsGeoJSON(d.geom) as district_geojson,
        r.id as region_id,
        r.nom as region_nom,
        r.code as region_code,
        ST_AsGeoJSON(r.geom) as region_geojson,
        f.id as fosa_id,
        f.nom as fosa_nom,
        f.type as fosa_type,
        f.latitude,
        f.longitude,
        f.est_ferme,
        f.situation
      FROM airesantes a
      INNER JOIN districts d ON ST_Within(a.geom, d.geom) OR a.district_id = d.id
      LEFT JOIN regions r ON ST_Within(d.geom, r.geom) OR d.region_id = r.id
      LEFT JOIN fosas f ON ST_DWithin(
        ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
        a.geom,
        0.1
      ) OR f.airesante_id = a.id
      ORDER BY a.id, f.id
      ${limitClause} ${offsetClause}
    `;

    const results = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return this.formatMultipleAiresantesSpatialResults(results);
  }

  async getByIdForMap(id: number) {
    const query = `
      SELECT
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.nom_dist as airesante_nom_dist,
        a.code_as as airesante_code,
        a.area as airesante_area,
        ST_AsGeoJSON(a.geom) as airesante_geojson,
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code,
        d.region as district_region,
        ST_AsGeoJSON(d.geom) as district_geojson,
        r.id as region_id,
        r.nom as region_nom,
        r.code as region_code,
        ST_AsGeoJSON(r.geom) as region_geojson,
        f.id as fosa_id,
        f.nom as fosa_nom,
        f.type as fosa_type,
        f.latitude,
        f.longitude,
        f.est_ferme,
        f.situation
      FROM airesantes a
      INNER JOIN districts d ON ST_Within(a.geom, d.geom) OR a.district_id = d.id
      LEFT JOIN regions r ON ST_Within(d.geom, r.geom) OR d.region_id = r.id
      LEFT JOIN fosas f ON ST_DWithin(
        ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
        a.geom,
        0.1
      ) OR f.airesante_id = a.id
      WHERE a.id = :airesanteId
      ORDER BY f.id
    `;

    const results = await sequelize.query(query, {
      replacements: { airesanteId: id },
      type: QueryTypes.SELECT,
    });

    return this.formatSpatialResults(results);
  }

  async getByDistrictForMap(districtId: number) {
    const query = `
      SELECT
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.nom_dist as airesante_nom_dist,
        a.code_as as airesante_code,
        a.area as airesante_area,
        ST_AsGeoJSON(a.geom) as airesante_geojson,
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code,
        d.region as district_region,
        ST_AsGeoJSON(d.geom) as district_geojson,
        f.id as fosa_id,
        f.nom as fosa_nom,
        f.type as fosa_type,
        f.latitude,
        f.longitude,
        f.est_ferme,
        f.situation
      FROM airesantes a
      INNER JOIN districts d ON ST_Within(a.geom, d.geom) AND d.id = :districtId
      LEFT JOIN fosas f ON ST_DWithin(
        ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
        a.geom,
        0.1
      ) OR f.airesante_id = a.id
      ORDER BY a.id, f.id
    `;

    const results = await sequelize.query(query, {
      replacements: { districtId },
      type: QueryTypes.SELECT,
    });

    return this.formatMultipleAiresantesSpatialResults(results);
  }

  private formatSpatialResults(results: any[]) {
    if (results.length === 0) return null;

    const airesante: any = {
      id: results[0].airesante_id,
      nom: results[0].airesante_nom,
      nomDist: results[0].airesante_nom_dist,
      code: results[0].airesante_code,
      area: results[0].airesante_area,
      geojson: results[0].airesante_geojson ? JSON.parse(results[0].airesante_geojson) : null,
      district: {
        id: results[0].district_id,
        nom: results[0].district_nom,
        code: results[0].district_code,
        region: results[0].district_region,
        geojson: results[0].district_geojson ? JSON.parse(results[0].district_geojson) : null,
      },
      fosas: [],
    };

    // Add region if available
    if (results[0].region_id) {
      airesante.district.regionData = {
        id: results[0].region_id,
        nom: results[0].region_nom,
        code: results[0].region_code,
        geojson: results[0].region_geojson ? JSON.parse(results[0].region_geojson) : null,
      };
    }

    results.forEach((row) => {
      if (row.fosa_id) {
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
    });

    return airesante;
  }

  private formatMultipleAiresantesSpatialResults(results: any[]) {
    if (results.length === 0) return [];

    const airesantesMap = new Map();

    results.forEach((row) => {
      // Build airesante
      if (!airesantesMap.has(row.airesante_id)) {
        airesantesMap.set(row.airesante_id, {
          id: row.airesante_id,
          nom: row.airesante_nom,
          nomDist: row.airesante_nom_dist,
          code: row.airesante_code,
          area: row.airesante_area,
          geojson: row.airesante_geojson ? JSON.parse(row.airesante_geojson) : null,
          district: row.district_id ? {
            id: row.district_id,
            nom: row.district_nom,
            code: row.district_code,
            region: row.district_region,
            geojson: row.district_geojson ? JSON.parse(row.district_geojson) : null,
            regionData: row.region_id ? {
              id: row.region_id,
              nom: row.region_nom,
              code: row.region_code,
              geojson: row.region_geojson ? JSON.parse(row.region_geojson) : null,
            } : null,
          } : null,
          fosas: [],
        });
      }

      const airesante = airesantesMap.get(row.airesante_id);

      // Build fosa
      if (row.fosa_id) {
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
    });

    return Array.from(airesantesMap.values());
  }
}
