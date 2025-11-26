import { BaseService } from "./BaseService";
import { Fosa } from "../models/Fosa";
import sequelize from "../config/database";
import { QueryTypes } from "sequelize";

export class FosaService extends BaseService<Fosa> {
  constructor() {
    super(Fosa);
  }

  // Override findAll to exclude geom
  async findAll(options?: any): Promise<Fosa[]> {
    const updatedOptions = {
      ...options,
      attributes: {
        exclude: ["geom"],
        ...options?.attributes,
      },
    };
    return await super.findAll(updatedOptions);
  }

  // Override findById to exclude geom
  async findById(id: number, options?: any): Promise<Fosa> {
    const updatedOptions = {
      ...options,
      attributes: {
        exclude: ["geom"],
        ...options?.attributes,
      },
    };
    return await super.findById(id, updatedOptions);
  }

  async getWithRelations(id: number) {
    return await this.findById(id, {
      include: [
        { association: "batiments" },
        { association: "personnels" },
        { association: "vehicules" },
        { association: "equipements" },
      ],
    });
  }

  async getByType(type: string) {
    return await this.findAll({
      where: { type },
    });
  }

  async getClosedFosas() {
    return await this.findAll({
      where: { estFerme: true },
    });
  }

  async getFunctionalFosas() {
    return await this.findAll({
      where: { fonction: true },
    });
  }

  async getFosasWithElectricity() {
    return await this.findAll({
      where: { connecteeElectricite: true },
    });
  }

  async getFosasWithTitle() {
    return await this.findAll({
      where: { aTitreFoncier: true },
    });
  }

  async getFosasWithFence() {
    return await this.findAll({
      where: { aCloture: true },
    });
  }

  // Méthodes avec jointures spatiales uniquement
  async getAllForMap(limit?: number, offset?: number) {
    const limitClause = limit !== undefined ? `LIMIT ${limit}` : "";
    const offsetClause = offset !== undefined ? `OFFSET ${offset}` : "";

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
        f.connectee_electricite,
        f.type_courant,
        f.org_unit,
        f.fonction,
        f.statut_rec,
        f.cat_rec,
        f.nom_directeur,
        -- Jointure spatiale avec airesante
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.code_as as airesante_code,
        ST_AsGeoJSON(a.geom) as airesante_geojson,
        -- Jointure spatiale avec arrondissement
        arr.id as arrondissement_id,
        arr.nom as arrondissement_nom,
        ST_AsGeoJSON(arr.geom) as arrondissement_geojson,
        -- Jointure spatiale avec district via arrondissement
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code,
        ST_AsGeoJSON(d.geom) as district_geojson,
        -- Jointure spatiale avec region via district
        r.id as region_id,
        r.nom as region_nom,
        ST_AsGeoJSON(r.geom) as region_geojson
      FROM tmpfosa f
      -- Jointure spatiale: FOSA dans une aire de santé
      LEFT JOIN airesantes a ON ST_Within(f.geom, a.geom)
      -- Jointure spatiale: FOSA dans un arrondissement
      LEFT JOIN arrondissements arr ON ST_Within(f.geom, arr.geom)
      -- Jointure spatiale: FOSA dans un district (via arrondissement ou directement)
      LEFT JOIN districts d ON ST_Within(f.geom, d.geom)
      -- Jointure spatiale: FOSA dans une région
      LEFT JOIN regions r ON ST_Within(f.geom, r.geom)
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
        f.image,
        f.a_titre_foncier,
        f.a_cloture,
        f.connectee_electricite,
        f.type_courant,
        f.org_unit,
        f.fonction,
        f.statut_rec,
        f.cat_rec,
        f.nom_directeur,
        -- Jointure spatiale avec airesante
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.code_as as airesante_code,
        ST_AsGeoJSON(a.geom) as airesante_geojson,
        -- Jointure spatiale avec arrondissement
        arr.id as arrondissement_id,
        arr.nom as arrondissement_nom,
        ST_AsGeoJSON(arr.geom) as arrondissement_geojson,
        -- Jointure spatiale avec district
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code,
        ST_AsGeoJSON(d.geom) as district_geojson,
        -- Jointure spatiale avec region
        r.id as region_id,
        r.nom as region_nom,
        ST_AsGeoJSON(r.geom) as region_geojson
      FROM tmpfosa f
      -- Jointures spatiales
      LEFT JOIN airesantes a ON ST_Within(f.geom, a.geom)
      LEFT JOIN arrondissements arr ON ST_Within(f.geom, arr.geom)
      LEFT JOIN districts d ON ST_Within(f.geom, d.geom)
      LEFT JOIN regions r ON ST_Within(f.geom, r.geom)
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
        f.image,
        f.a_titre_foncier,
        f.a_cloture,
        f.connectee_electricite,
        f.type_courant,
        f.org_unit,
        f.fonction,
        f.statut_rec,
        f.cat_rec,
        f.nom_directeur,
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.code_as as airesante_code,
        ST_AsGeoJSON(a.geom) as airesante_geojson,
        arr.id as arrondissement_id,
        arr.nom as arrondissement_nom,
        ST_AsGeoJSON(arr.geom) as arrondissement_geojson
      FROM tmpfosa f
      -- Jointure spatiale avec l'aire de santé spécifique
      INNER JOIN airesantes a ON a.id = :airesanteId AND ST_Within(f.geom, a.geom)
      -- Jointure spatiale avec arrondissement
      LEFT JOIN arrondissements arr ON ST_Within(f.geom, arr.geom)
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
      image: row.image,
      aTitreFoncier: row.a_titre_foncier,
      aCloture: row.a_cloture,
      connecteeElectricite: row.connectee_electricite,
      typeCourant: row.type_courant,
      orgUnit: row.org_unit,
      fonction: row.fonction,
      statutRec: row.statut_rec,
      catRec: row.cat_rec,
      nomDirect: row.nom_directeur,
      airesante: {
        id: row.airesante_id,
        nom: row.airesante_nom,
        code: row.airesante_code,
        geojson: row.airesante_geojson
          ? JSON.parse(row.airesante_geojson)
          : null,
      },
      arrondissement: row.arrondissement_id
        ? {
            id: row.arrondissement_id,
            nom: row.arrondissement_nom,
            geojson: row.arrondissement_geojson
              ? JSON.parse(row.arrondissement_geojson)
              : null,
          }
        : null,
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
      connecteeElectricite: row.connectee_electricite,
      typeCourant: row.type_courant,
      orgUnit: row.org_unit,
      fonction: row.fonction,
      statutRec: row.statut_rec,
      catRec: row.cat_rec,
      nomDirect: row.nom_directeur,

      // Relations includes
      batiments: fosaWithRelations?.batiments || [],
      vehicules: fosaWithRelations?.vehicules || [],
      equipements: fosaWithRelations?.equipements || [],
      personnels: fosaWithRelations?.personnels || [],

      // Relations spatiales
      airesante: row.airesante_id
        ? {
            id: row.airesante_id,
            nom: row.airesante_nom,
            nom_as: row.airesante_nom,
            code: row.airesante_code,
            geojson: row.airesante_geojson
              ? JSON.parse(row.airesante_geojson)
              : null,
          }
        : null,
      arrondissement: row.arrondissement_id
        ? {
            id: row.arrondissement_id,
            nom: row.arrondissement_nom,
            geojson: row.arrondissement_geojson
              ? JSON.parse(row.arrondissement_geojson)
              : null,
          }
        : null,
      district: row.district_id
        ? {
            id: row.district_id,
            nom: row.district_nom,
            nom_ds: row.district_nom,
            code: row.district_code,
            geojson: row.district_geojson
              ? JSON.parse(row.district_geojson)
              : null,
          }
        : null,
      region: row.region_id
        ? {
            id: row.region_id,
            nom: row.region_nom,
            geojson: row.region_geojson ? JSON.parse(row.region_geojson) : null,
          }
        : null,
    };
  }

  // Méthode avec vraie jointure spatiale - FOSAs dans une région
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
        f.fonction,
        f.statut_rec,
        f.cat_rec,
        f.a_cloture,
        f.a_titre_foncier,
        f.connectee_electricite,
        -- Informations de l'aire de santé (jointure spatiale)
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.code_as as airesante_code,
        -- Informations de l'arrondissement (jointure spatiale)
        arr.id as arrondissement_id,
        arr.nom as arrondissement_nom,
        -- Informations du district (jointure spatiale)
        d.id as district_id,
        d.nom_ds as district_nom,
        d.code_ds as district_code
      FROM tmpfosa f
      -- Jointure spatiale avec la région
      INNER JOIN regions r ON r.id = :regionId AND ST_Within(f.geom, r.geom)
      -- Jointures spatiales avec les autres entités
      LEFT JOIN airesantes a ON ST_Within(f.geom, a.geom)
      LEFT JOIN arrondissements arr ON ST_Within(f.geom, arr.geom)
      LEFT JOIN districts d ON ST_Within(f.geom, d.geom)
      ORDER BY f.nom
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
      fonction: row.fonction,
      statutRec: row.statut_rec,
      catRec: row.cat_rec,
      aCloture: row.a_cloture,
      aTitreFoncier: row.a_titre_foncier,
      connecteeElectricite: row.connectee_electricite,
      airesante: row.airesante_id
        ? {
            id: row.airesante_id,
            nom: row.airesante_nom,
            code: row.airesante_code,
          }
        : null,
      arrondissement: row.arrondissement_id
        ? {
            id: row.arrondissement_id,
            nom: row.arrondissement_nom,
          }
        : null,
      district: row.district_id
        ? {
            id: row.district_id,
            nom: row.district_nom,
            code: row.district_code,
          }
        : null,
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
        f.fonction,
        f.a_cloture,
        f.a_titre_foncier,
        f.connectee_electricite,
        -- Informations de l'aire de santé
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.code_as as airesante_code,
        -- Informations de l'arrondissement
        arr.id as arrondissement_id,
        arr.nom as arrondissement_nom
      FROM tmpfosa f
      -- Jointure spatiale avec le district
      INNER JOIN districts d ON d.id = :districtId AND ST_Within(f.geom, d.geom)
      -- Jointures spatiales avec les autres entités
      LEFT JOIN airesantes a ON ST_Within(f.geom, a.geom)
      LEFT JOIN arrondissements arr ON ST_Within(f.geom, arr.geom)
      ORDER BY f.nom
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
      fonction: row.fonction,
      aCloture: row.a_cloture,
      aTitreFoncier: row.a_titre_foncier,
      connecteeElectricite: row.connectee_electricite,
      airesante: row.airesante_id
        ? {
            id: row.airesante_id,
            nom: row.airesante_nom,
            code: row.airesante_code,
          }
        : null,
      arrondissement: row.arrondissement_id
        ? {
            id: row.arrondissement_id,
            nom: row.arrondissement_nom,
          }
        : null,
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
        f.fonction,
        f.org_unit,
        f.nom_directeur,
        f.a_cloture,
        f.a_titre_foncier,
        f.connectee_electricite,
        a.id as airesante_id,
        a.nom_as as airesante_nom,
        a.code_as as airesante_code
      FROM tmpfosa f
      -- Jointure spatiale avec l'aire de santé
      INNER JOIN airesantes a ON a.id = :airesanteId AND ST_Within(f.geom, a.geom)
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
      fonction: row.fonction,
      orgUnit: row.org_unit,
      nomDirect: row.nom_directeur,
      aCloture: row.a_cloture,
      aTitreFoncier: row.a_titre_foncier,
      connecteeElectricite: row.connectee_electricite,
      airesante: {
        id: row.airesante_id,
        nom: row.airesante_nom,
        code: row.airesante_code,
      },
    }));
  }

  // FOSAs dans un arrondissement avec jointure spatiale
  async getFosasByArrondissementSpatial(arrondissementId: number) {
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
        f.fonction,
        f.a_cloture,
        f.a_titre_foncier,
        f.connectee_electricite,
        arr.id as arrondissement_id,
        arr.nom as arrondissement_nom,
        a.id as airesante_id,
        a.nom_as as airesante_nom
      FROM tmpfosa f
      -- Jointure spatiale avec l'arrondissement
      INNER JOIN arrondissements arr ON arr.id = :arrondissementId AND ST_Within(f.geom, arr.geom)
      -- Jointure spatiale avec l'aire de santé
      LEFT JOIN airesantes a ON ST_Within(f.geom, a.geom)
      ORDER BY f.nom
    `;

    const results = await sequelize.query(query, {
      replacements: { arrondissementId },
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
      fonction: row.fonction,
      aCloture: row.a_cloture,
      aTitreFoncier: row.a_titre_foncier,
      connecteeElectricite: row.connectee_electricite,
      arrondissement: {
        id: row.arrondissement_id,
        nom: row.arrondissement_nom,
      },
      airesante: row.airesante_id
        ? {
            id: row.airesante_id,
            nom: row.airesante_nom,
          }
        : null,
    }));
  }

  // Statistiques avancées
  async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_fosas,
        COUNT(CASE WHEN est_ferme = true THEN 1 END) as fosas_fermes,
        COUNT(CASE WHEN fonction = true THEN 1 END) as fosas_fonctionnels,
        COUNT(CASE WHEN a_cloture = true THEN 1 END) as fosas_avec_cloture,
        COUNT(CASE WHEN a_titre_foncier = true THEN 1 END) as fosas_avec_titre,
        COUNT(CASE WHEN connectee_electricite = true THEN 1 END) as fosas_avec_electricite,
        COUNT(DISTINCT type) as types_differents,
        AVG(capacite_lits) as capacite_moyenne_lits
      FROM tmpfosa
      WHERE est_ferme = false
    `;

    const results = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return results[0];
  }

  // Recherche de FOSAs par nom avec jointures spatiales
  async searchFosas(searchTerm: string, filters?: any) {
    let whereClause = `f.nom ILIKE :searchTerm`;
    const replacements: any = { searchTerm: `%${searchTerm}%` };

    if (filters) {
      if (filters.type) {
        whereClause += ` AND f.type = :type`;
        replacements.type = filters.type;
      }
      if (filters.fonction !== undefined) {
        whereClause += ` AND f.fonction = :fonction`;
        replacements.fonction = filters.fonction;
      }
      if (filters.estFerme !== undefined) {
        whereClause += ` AND f.est_ferme = :estFerme`;
        replacements.estFerme = filters.estFerme;
      }
    }

    const query = `
      SELECT
        f.id,
        f.nom,
        f.type,
        f.latitude,
        f.longitude,
        f.est_ferme,
        f.fonction,
        f.org_unit,
        -- Informations spatiales
        a.nom_as as airesante_nom,
        arr.nom as arrondissement_nom,
        d.nom_ds as district_nom,
        r.nom as region_nom
      FROM tmpfosa f
      -- Jointures spatiales
      LEFT JOIN airesantes a ON ST_Within(f.geom, a.geom)
      LEFT JOIN arrondissements arr ON ST_Within(f.geom, arr.geom)
      LEFT JOIN districts d ON ST_Within(f.geom, d.geom)
      LEFT JOIN regions r ON ST_Within(f.geom, r.geom)
      WHERE ${whereClause}
      ORDER BY f.nom
      LIMIT 50
    `;

    return await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });
  }
  // FOSAs dans un département avec jointure spatiale
  async getFosasByDepartementSpatial(departementId: number) {
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
      f.fonction,
      f.a_cloture,
      f.a_titre_foncier,
      f.connectee_electricite,
      -- Informations du département
      dep.id as departement_id,
      dep.departement as departement_nom,
      -- Informations de l'aire de santé
      a.id as airesante_id,
      a.nom_as as airesante_nom,
      a.code_as as airesante_code,
      -- Informations de l'arrondissement
      arr.id as arrondissement_id,
      arr.nom as arrondissement_nom
    FROM tmpfosa f
    -- Jointure spatiale avec le département
    INNER JOIN departements dep ON dep.id = :departementId AND ST_Within(f.geom, dep.geom)
    -- Jointures spatiales avec les autres entités
    LEFT JOIN airesantes a ON ST_Within(f.geom, a.geom)
    LEFT JOIN arrondissements arr ON ST_Within(f.geom, arr.geom)
    ORDER BY f.nom
  `;

    const results = await sequelize.query(query, {
      replacements: { departementId },
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
      fonction: row.fonction,
      aCloture: row.a_cloture,
      aTitreFoncier: row.a_titre_foncier,
      connecteeElectricite: row.connectee_electricite,
      departement: {
        id: row.departement_id,
        nom: row.departement_nom,
      },
      airesante: row.airesante_id
        ? {
            id: row.airesante_id,
            nom: row.airesante_nom,
            code: row.airesante_code,
          }
        : null,
      arrondissement: row.arrondissement_id
        ? {
            id: row.arrondissement_id,
            nom: row.arrondissement_nom,
          }
        : null,
    }));
  }
  // Méthode pour trouver les FOSAs dans un rayon (en mètres)
  async getFosasInRadius(lat: number, lng: number, radius: number) {
    const query = `
      SELECT
        f.id,
        f.nom,
        f.type,
        f.latitude,
        f.longitude,
        f.est_ferme,
        f.fonction,
        f.capacite_lits,
        ST_Distance(f.geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) as distance
      FROM tmpfosa f
      WHERE ST_DWithin(f.geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)
      ORDER BY distance
      LIMIT 100
    `;

    return await sequelize.query(query, {
      replacements: { lat, lng, radius },
      type: QueryTypes.SELECT,
    });
  }
}
