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

  // Méthodes avec vraies jointures spatiales PostGIS (ST_Within, ST_AsGeoJSON)
  async getAllForMap(limit?: number, offset?: number) {
    const limitClause = limit !== undefined ? `LIMIT ${limit}` : '';
    const offsetClause = offset !== undefined ? `OFFSET ${offset}` : '';

    const query = `
      SELECT
        r.id as region_id,
        r.nom as region_nom,
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
      LEFT JOIN districts d ON ST_Contains(r.geom, d.geom) OR d.region_id = r.id
      LEFT JOIN airesantes a ON ST_Contains(d.geom, a.geom) OR a.district_id = d.id
      LEFT JOIN fosas f ON (
        ST_Distance(POINT(f.longitude, f.latitude), a.geom) <= 0.1
      ) OR f.airesante_id = a.id
      ORDER BY r.id, d.id, a.id, f.id
      ${limitClause} ${offsetClause}
    `;

    const results = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return this.formatMultipleRegionsSpatialResults(results);
  }

  async getByIdForMap(id: number) {
    return await this.getByIdWithSpatialJoin(id);
  }

  async getByIdWithSpatialJoin(regionId: number) {
    const query = `
      SELECT
        r.id as region_id,
        r.nom as region_nom,
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
      LEFT JOIN districts d ON ST_Contains(r.geom, d.geom) OR d.region_id = r.id
      LEFT JOIN airesantes a ON ST_Contains(d.geom, a.geom) OR a.district_id = d.id
      LEFT JOIN fosas f ON (
        ST_Distance(POINT(f.longitude, f.latitude), a.geom) <= 0.1
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

  private formatMultipleRegionsSpatialResults(results: any[]) {
    if (results.length === 0) return [];

    const regionsMap = new Map();
    const districtsMap = new Map();
    const airesantesMap = new Map();

    results.forEach((row) => {
      // Build region
      if (!regionsMap.has(row.region_id)) {
        regionsMap.set(row.region_id, {
          id: row.region_id,
          nom: row.region_nom,
          geojson: row.region_geojson ? JSON.parse(row.region_geojson) : null,
          districts: [],
        });
      }

      const region = regionsMap.get(row.region_id);

      // Build district
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

        const district = districtsMap.get(row.district_id);
        if (district) {
          district.airesantes.push(airesante);
        }
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

    return Array.from(regionsMap.values());
  }
}
