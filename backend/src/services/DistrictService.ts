import { BaseService } from "./BaseService"
import { District } from "../models/District"
import sequelize from "../config/database"
import { QueryTypes } from "sequelize"

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

  // Méthodes avec vraies jointures spatiales PostGIS (ST_Within, ST_AsGeoJSON)
  async getAllForMap(limit?: number, offset?: number) {
    const limitClause = limit !== undefined ? `LIMIT ${limit}` : '';
    const offsetClause = offset !== undefined ? `OFFSET ${offset}` : '';

    const query = `
      SELECT
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code,
        d.region as district_region,
        ST_AsGeoJSON(d.geom) as district_geojson,
        r.id as region_id,
        r.nom as region_nom,
        ST_AsGeoJSON(r.geom) as region_geojson,
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
      FROM districts d
      INNER JOIN regions r ON ST_Within(d.geom, r.geom) OR d.region_id = r.id
      LEFT JOIN airesantes a ON ST_Within(a.geom, d.geom) OR a.district_id = d.id
      LEFT JOIN fosas f ON ST_DWithin(
        ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
        a.geom,
        0.1
      ) OR f.airesante_id = a.id
      ORDER BY d.id, a.id, f.id
      ${limitClause} ${offsetClause}
    `;

    const results = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return this.formatMultipleDistrictsSpatialResults(results);
  }

  async getByIdForMap(id: number) {
    const query = `
      SELECT
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code,
        d.region as district_region,
        ST_AsGeoJSON(d.geom) as district_geojson,
        r.id as region_id,
        r.nom as region_nom,
        ST_AsGeoJSON(r.geom) as region_geojson,
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
      FROM districts d
      INNER JOIN regions r ON ST_Within(d.geom, r.geom) OR d.region_id = r.id
      LEFT JOIN airesantes a ON ST_Within(a.geom, d.geom) OR a.district_id = d.id
      LEFT JOIN fosas f ON ST_DWithin(
        ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
        a.geom,
        0.1
      ) OR f.airesante_id = a.id
      WHERE d.id = :districtId
      ORDER BY a.id, f.id
    `;

    const results = await sequelize.query(query, {
      replacements: { districtId: id },
      type: QueryTypes.SELECT,
    });

    return this.formatSpatialResults(results);
  }

  async getByRegionForMap(regionId: number) {
    const query = `
      SELECT
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code,
        d.region as district_region,
        ST_AsGeoJSON(d.geom) as district_geojson,
        r.id as region_id,
        r.nom as region_nom,
        ST_AsGeoJSON(r.geom) as region_geojson,
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
      FROM districts d
      INNER JOIN regions r ON ST_Within(d.geom, r.geom) AND r.id = :regionId
      LEFT JOIN airesantes a ON ST_Within(a.geom, d.geom) OR a.district_id = d.id
      LEFT JOIN fosas f ON ST_DWithin(
        ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
        a.geom,
        0.1
      ) OR f.airesante_id = a.id
      ORDER BY d.id, a.id, f.id
    `;

    const results = await sequelize.query(query, {
      replacements: { regionId },
      type: QueryTypes.SELECT,
    });

    return this.formatMultipleDistrictsSpatialResults(results);
  }

  private formatSpatialResults(results: any[]) {
    if (results.length === 0) return null;

    const district: any = {
      id: results[0].district_id,
      nom: results[0].district_nom,
      code: results[0].district_code,
      region: results[0].district_region,
      geojson: results[0].district_geojson ? JSON.parse(results[0].district_geojson) : null,
      regionData: {
        id: results[0].region_id,
        nom: results[0].region_nom,
        geojson: results[0].region_geojson ? JSON.parse(results[0].region_geojson) : null,
      },
      airesantes: [],
    };

    const airesantesMap = new Map();

    results.forEach((row) => {
      if (row.airesante_id && !airesantesMap.has(row.airesante_id)) {
        const airesante = {
          id: row.airesante_id,
          nom: row.airesante_nom,
          code: row.airesante_code,
          geojson: row.airesante_geojson ? JSON.parse(row.airesante_geojson) : null,
          fosas: [],
        };
        airesantesMap.set(row.airesante_id, airesante);
        district.airesantes.push(airesante);
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

    return district;
  }

  private formatMultipleDistrictsSpatialResults(results: any[]) {
    if (results.length === 0) return [];

    const districtsMap = new Map();
    const airesantesMap = new Map();

    results.forEach((row) => {
      // Build district
      if (!districtsMap.has(row.district_id)) {
        districtsMap.set(row.district_id, {
          id: row.district_id,
          nom: row.district_nom,
          code: row.district_code,
          region: row.district_region,
          geojson: row.district_geojson ? JSON.parse(row.district_geojson) : null,
          regionData: row.region_id ? {
            id: row.region_id,
            nom: row.region_nom,
            geojson: row.region_geojson ? JSON.parse(row.region_geojson) : null,
          } : null,
          airesantes: [],
        });
      }

      const district = districtsMap.get(row.district_id);

      // Build airesante
      if (row.airesante_id && !airesantesMap.has(row.airesante_id)) {
        const airesante = {
          id: row.airesante_id,
          nom: row.airesante_nom,
          code: row.airesante_code,
          geojson: row.airesante_geojson ? JSON.parse(row.airesante_geojson) : null,
          fosas: [],
        };
        airesantesMap.set(row.airesante_id, airesante);
        district.airesantes.push(airesante);
      }

      // Build fosa
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

    return Array.from(districtsMap.values());
  }
}
