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

  // Méthodes avec vraies jointures spatiales PostGIS (ST_Within, ST_DWithin, ST_AsGeoJSON)
  async getAllForMap(limit?: number, offset?: number) {
    const limitClause = limit !== undefined ? `LIMIT ${limit}` : '';
    const offsetClause = offset !== undefined ? `OFFSET ${offset}` : '';

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
        f.image,
        f.a_titre_foncier,
        f.a_cloture,
        f.org_unit,
        f.fonction,
        f.statut_rec,
        f.cat_rec,
        f.nom_direct,
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.code_as as airesante_code,
        ST_AsGeoJSON(a.geom) as airesante_geojson,
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code,
        d.region as district_region,
        ST_AsGeoJSON(d.geom) as district_geojson,
        r.id as region_id,
        r.nom as region_nom,
        ST_AsGeoJSON(r.geom) as region_geojson,
        arr.id as arrondissement_id,
        arr.nom as arrondissement_nom,
        ST_AsGeoJSON(arr.geom) as arrondissement_geojson
      FROM fosas f
      INNER JOIN airesantes a ON f.airesante_id = a.id
      INNER JOIN districts d ON ST_Contains(d.geom, a.geom) OR a.district_id = d.id
      LEFT JOIN regions r ON ST_Contains(r.geom, d.geom) OR d.region_id = r.id
      LEFT JOIN arrondissements arr ON f.arrondissement_id = arr.id
      ORDER BY f.id
      ${limitClause} ${offsetClause}
    `;

    const results = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return Promise.all(results.map((row: any) => this.formatFosaResult(row)));
  }

  async getByIdForMap(id: number) {
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
        d.region as district_region,
        ST_AsGeoJSON(d.geom) as district_geojson,
        r.id as region_id,
        r.nom as region_nom,
        ST_AsGeoJSON(r.geom) as region_geojson,
        arr.id as arrondissement_id,
        arr.nom as arrondissement_nom,
        ST_AsGeoJSON(arr.geom) as arrondissement_geojson
      FROM fosas f
      INNER JOIN airesantes a ON f.airesante_id = a.id
      INNER JOIN districts d ON ST_Contains(d.geom, a.geom) OR a.district_id = d.id
      LEFT JOIN regions r ON ST_Contains(r.geom, d.geom) OR d.region_id = r.id
      LEFT JOIN arrondissements arr ON f.arrondissement_id = arr.id
      WHERE f.id = :fosaId
    `;

    const results = await sequelize.query(query, {
      replacements: { fosaId: id },
      type: QueryTypes.SELECT,
    });

    if (results.length === 0) return null;
    return this.formatFosaResult(results[0]);
  }

  async getByAiresanteForMap(airesanteId: number) {
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
        arr.id as arrondissement_id,
        arr.nom as arrondissement_nom,
        ST_AsGeoJSON(arr.geom) as arrondissement_geojson
      FROM fosas f
      INNER JOIN airesantes a ON f.airesante_id = a.id AND a.id = :airesanteId
      LEFT JOIN arrondissements arr ON f.arrondissement_id = arr.id
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
        code: row.airesante_code,
        geojson: row.airesante_geojson ? JSON.parse(row.airesante_geojson) : null,
      },
      arrondissement: row.arrondissement_id ? {
        id: row.arrondissement_id,
        nom: row.arrondissement_nom,
        geojson: row.arrondissement_geojson ? JSON.parse(row.arrondissement_geojson) : null,
      } : null,
    }));
  }

  private async formatFosaResult(row: any) {
    // Récupérer les relations pour cette FOSA
    const fosaWithRelations: any = await this.getWithRelations(row.id);

    return {
      id: row.id,
      nom: row.nom,
      type: row.type,
      latitude: row.latitude,
      longitude: row.longitude,
      estFerme: row.est_ferme,
      situation: row.situation,
      capaciteLits: row.capacite_lits,

      // Nouveaux champs
      image: row.image,
      aTitreFoncier: row.a_titre_foncier,
      aCloture: row.a_cloture,
      orgUnit: row.org_unit,
      fonction: row.fonction,
      statutRec: row.statut_rec,
      catRec: row.cat_rec,
      nomDirect: row.nom_direct,

      // Relations includes
      batiments: fosaWithRelations?.batiments || [],
      materielroulants: fosaWithRelations?.materielroulants || [],
      personnels: fosaWithRelations?.personnels || [],

      airesante: {
        id: row.airesante_id,
        nom: row.airesante_nom,
        nom_as: row.airesante_nom,
        code: row.airesante_code,
        geojson: row.airesante_geojson ? JSON.parse(row.airesante_geojson) : null,
      },
      district: row.district_id ? {
        id: row.district_id,
        nom: row.district_nom,
        nom_ds: row.district_nom,
        code: row.district_code,
        region: row.district_region,
        geojson: row.district_geojson ? JSON.parse(row.district_geojson) : null,
      } : null,
      region: row.region_id ? {
        id: row.region_id,
        nom: row.region_nom,
        geojson: row.region_geojson ? JSON.parse(row.region_geojson) : null,
      } : null,
      arrondissement: row.arrondissement_id ? {
        id: row.arrondissement_id,
        nom: row.arrondissement_nom,
        geojson: row.arrondissement_geojson ? JSON.parse(row.arrondissement_geojson) : null,
      } : null,
    };
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
        ST_AsGeoJSON(r.geom) as region_geojson,
        arr.id as arrondissement_id,
        arr.nom as arrondissement_nom,
        ST_AsGeoJSON(arr.geom) as arrondissement_geojson
      FROM fosas f
      INNER JOIN airesantes a ON f.airesante_id = a.id
      INNER JOIN districts d ON a.district_id = d.id
      INNER JOIN regions r ON ST_Contains(r.geom, d.geom) AND r.id = :regionId
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
      INNER JOIN districts d ON ST_Contains(d.geom, a.geom) AND d.id = :districtId
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
      INNER JOIN airesantes a ON f.airesante_id = a.id AND a.id = :airesanteId
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
