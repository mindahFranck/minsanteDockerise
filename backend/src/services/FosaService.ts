import { BaseService } from "./BaseService"
import { Fosa } from "../models/Fosa"
import sequelize from "../config/database"
import { QueryTypes } from "sequelize"

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

  // Méthode avec vraie jointure spatiale PostGIS - FOSAs dans une région
  async getFosasByRegionSpatial(regionId: number) {
    const query = `
      SELECT
        f.id,
        f.nom,
        f.type,
        f.latitude,
        f.longitude,
        f.est_ferme,
        f.situation,
        f.capacite_lits,
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.code_as as airesante_code,
        ST_AsGeoJSON(a.geom) as airesante_geojson,
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code,
        ST_AsGeoJSON(d.geom) as district_geojson,
        r.id as region_id,
        r.nom as region_nom,
        r.code as region_code,
        ST_AsGeoJSON(r.geom) as region_geojson,
        arr.id as arrondissement_id,
        arr.nom as arrondissement_nom,
        ST_AsGeoJSON(arr.geom) as arrondissement_geojson
      FROM fosas f
      INNER JOIN airesantes a ON f.airesante_id = a.id
      INNER JOIN districts d ON a.district_id = d.id
      INNER JOIN regions r ON ST_Within(d.geom, r.geom) AND r.id = :regionId
      LEFT JOIN arrondissements arr ON f.arrondissement_id = arr.id
      ORDER BY d.nom_ds, a.nom_as, f.nom
    `;

    const results = await sequelize.query(query, {
      replacements: { regionId },
      type: QueryTypes.SELECT,
    });

    return results.map((row: any) => ({
      id: row.id,
      nom: row.nom,
      type: row.type,
      latitude: row.latitude,
      longitude: row.longitude,
      estFerme: row.est_ferme,
      situation: row.situation,
      capaciteLits: row.capacite_lits,
      airesante: {
        id: row.airesante_id,
        nom: row.airesante_nom,
        code: row.airesante_code,
        geojson: row.airesante_geojson ? JSON.parse(row.airesante_geojson) : null,
      },
      district: {
        id: row.district_id,
        nom: row.district_nom,
        code: row.district_code,
        geojson: row.district_geojson ? JSON.parse(row.district_geojson) : null,
      },
      region: {
        id: row.region_id,
        nom: row.region_nom,
        code: row.region_code,
        geojson: row.region_geojson ? JSON.parse(row.region_geojson) : null,
      },
      arrondissement: row.arrondissement_id ? {
        id: row.arrondissement_id,
        nom: row.arrondissement_nom,
        geojson: row.arrondissement_geojson ? JSON.parse(row.arrondissement_geojson) : null,
      } : null,
    }));
  }

  // FOSAs dans un district avec jointure spatiale
  async getFosasByDistrictSpatial(districtId: number) {
    const query = `
      SELECT
        f.id,
        f.nom,
        f.type,
        f.latitude,
        f.longitude,
        f.est_ferme,
        f.situation,
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        ST_AsGeoJSON(a.geom) as airesante_geojson,
        d.id as district_id,
        d.nom_ds as district_nom,
        ST_AsGeoJSON(d.geom) as district_geojson
      FROM fosas f
      INNER JOIN airesantes a ON f.airesante_id = a.id
      INNER JOIN districts d ON ST_Within(a.geom, d.geom) AND d.id = :districtId
      ORDER BY a.nom_as, f.nom
    `;

    const results = await sequelize.query(query, {
      replacements: { districtId },
      type: QueryTypes.SELECT,
    });

    return results.map((row: any) => ({
      id: row.id,
      nom: row.nom,
      type: row.type,
      latitude: row.latitude,
      longitude: row.longitude,
      estFerme: row.est_ferme,
      situation: row.situation,
      airesante: {
        id: row.airesante_id,
        nom: row.airesante_nom,
        geojson: row.airesante_geojson ? JSON.parse(row.airesante_geojson) : null,
      },
      district: {
        id: row.district_id,
        nom: row.district_nom,
        geojson: row.district_geojson ? JSON.parse(row.district_geojson) : null,
      },
    }));
  }

  // FOSAs dans une aire de santé avec jointure spatiale
  async getFosasByAiresanteSpatial(airesanteId: number) {
    const query = `
      SELECT
        f.id,
        f.nom,
        f.type,
        f.latitude,
        f.longitude,
        f.est_ferme,
        f.situation,
        f.capacite_lits,
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        ST_AsGeoJSON(a.geom) as airesante_geojson
      FROM fosas f
      INNER JOIN airesantes a ON ST_DWithin(
        ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
        a.geom,
        0.1
      ) AND a.id = :airesanteId
      ORDER BY f.nom
    `;

    const results = await sequelize.query(query, {
      replacements: { airesanteId },
      type: QueryTypes.SELECT,
    });

    return results.map((row: any) => ({
      id: row.id,
      nom: row.nom,
      type: row.type,
      latitude: row.latitude,
      longitude: row.longitude,
      estFerme: row.est_ferme,
      situation: row.situation,
      capaciteLits: row.capacite_lits,
      airesante: {
        id: row.airesante_id,
        nom: row.airesante_nom,
        geojson: row.airesante_geojson ? JSON.parse(row.airesante_geojson) : null,
      },
    }));
  }
}
