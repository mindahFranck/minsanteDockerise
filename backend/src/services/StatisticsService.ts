import sequelize from "../config/database";
import { QueryTypes } from "sequelize";
import { Fosa } from "../models/Fosa";
import { Personnel } from "../models/Personnel";
import { Equipement } from "../models/Equipement";
import { Equipebio } from "../models/Equipebio";
import { Materielroulant } from "../models/Materielroulant";
import { Region } from "../models/Region";
import { Departement } from "../models/Departement";
import { Batiment } from "../models/Batiment";
import { Parametre } from "../models/Parametre";

export class StatisticsService {
  async getOverview() {
    const [
      totalRegions,
      totalDepartements,
      totalFosas,
      totalPersonnels,
      totalEquipements,
      totalEquipebios,
      totalVehicules,
      closedFosas,
    ] = await Promise.all([
      Region.count(),
      Departement.count(),
      Fosa.count(),
      Personnel.count(),
      Equipement.count(),
      Equipebio.count(),
      Materielroulant.count(),
      Fosa.count({ where: { estFerme: true } }),
    ]);

    return {
      geographic: {
        totalRegions,
        totalDepartements,
      },
      facilities: {
        totalFosas,
        activeFosas: totalFosas - closedFosas,
        closedFosas,
      },
      resources: {
        totalPersonnels,
        totalEquipements,
        totalEquipebios,
        totalVehicules,
      },
    };
  }

  async getFosaStatistics() {
    const fosasByType = await Fosa.findAll({
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["type"],
      raw: true,
    });

    const fosasByRegion = await Fosa.findAll({
      attributes: [[sequelize.fn("COUNT", sequelize.col("Fosa.id")), "count"]],
      include: [
        {
          association: "arrondissement",
          attributes: [],
          include: [
            {
              association: "departement",
              attributes: [],
              include: [
                {
                  association: "region",
                  attributes: ["nom"],
                },
              ],
            },
          ],
        },
      ],
      group: ["arrondissement.departement.region.id"],
      raw: true,
    });

    const totalCapacity = await Fosa.sum("capaciteLits");

    return {
      byType: fosasByType,
      byRegion: fosasByRegion,
      totalBedCapacity: totalCapacity || 0,
    };
  }

  async getPersonnelStatistics() {
    const personnelByCategory = await Personnel.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("Personnel.id")), "count"],
      ],
      include: [
        {
          association: "categorie",
          attributes: ["nom"],
        },
      ],
      group: ["categorie.id"],
      raw: true,
    });

    const personnelByFosa = await Personnel.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("Personnel.id")), "count"],
      ],
      include: [
        {
          association: "fosa",
          attributes: ["nom"],
        },
      ],
      group: ["fosa.id"],
      order: [[sequelize.fn("COUNT", sequelize.col("Personnel.id")), "DESC"]],
      limit: 10,
      raw: true,
    });

    return {
      byCategory: personnelByCategory,
      topFosasByPersonnel: personnelByFosa,
    };
  }

  async getEquipmentStatistics() {
    const equipementsByType = await Equipement.findAll({
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["type"],
      raw: true,
    });

    const equipebiosByType = await Equipebio.findAll({
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["type"],
      raw: true,
    });

    const vehiculesByType = await Materielroulant.findAll({
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["type"],
      raw: true,
    });

    const vehiculesByYear = await Materielroulant.findAll({
      attributes: [
        "annee",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["annee"],
      order: [["annee", "DESC"]],
      raw: true,
    });

    return {
      equipements: {
        byType: equipementsByType,
        total: await Equipement.count(),
      },
      equipebios: {
        byType: equipebiosByType,
        total: await Equipebio.count(),
      },
      vehicules: {
        byType: vehiculesByType,
        byYear: vehiculesByYear,
        total: await Materielroulant.count(),
      },
    };
  }

  async getGeographicDistribution() {
    const regionStats = await Region.findAll({
      attributes: [
        "id",
        "nom",
        "population",
        [
          sequelize.fn("COUNT", sequelize.col("departements.id")),
          "totalDepartements",
        ],
      ],
      include: [
        {
          association: "departements",
          attributes: [],
        },
      ],
      group: ["Region.id"],
      raw: true,
    });

    return {
      regions: regionStats,
    };
  }

  async getBuildingStatistics() {
    const batimentsByType = await Batiment.findAll({
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["type"],
      raw: true,
    });

    const batimentsByState = await Batiment.findAll({
      attributes: [
        "etat",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["etat"],
      raw: true,
    });

    return {
      byType: batimentsByType,
      byState: batimentsByState,
      total: await Batiment.count(),
    };
  }

  async getPatientStatistics() {
    const latestParametres = await Parametre.findAll({
      attributes: [
        [
          sequelize.fn("SUM", sequelize.col("nombre_patients_ambulants")),
          "totalAmbulants",
        ],
        [
          sequelize.fn("SUM", sequelize.col("nombre_patients_totaux")),
          "totalPatients",
        ],
      ],
      raw: true,
    });

    return {
      totalAmbulants: (latestParametres[0] as any)?.totalAmbulants || 0,
      totalPatients: (latestParametres[0] as any)?.totalPatients || 0,
    };
  }

  async getComparativeStatistics() {
    // FOSA par catégorie avec TF/Clôture
    const fosasByCategoryQuery = await sequelize.query(
      `
      SELECT
        COALESCE(cat_rec, 'Non spécifié') as category,
        COUNT(*) as total,
        SUM(CASE WHEN a_titre_foncier = 1 THEN 1 ELSE 0 END) as withTF,
        SUM(CASE WHEN a_cloture = 1 THEN 1 ELSE 0 END) as withCloture,
        SUM(CASE WHEN fonction = 1 THEN 1 ELSE 0 END) as operational
      FROM tmpfosa
      GROUP BY cat_rec
      ORDER BY total DESC
    `,
      { type: QueryTypes.SELECT }
    );

    // FOSA par statut
    const fosasByStatusQuery = await sequelize.query(
      `
      SELECT
        COALESCE(statut_rec, 'Non spécifié') as status,
        COUNT(*) as total,
        SUM(CASE WHEN a_titre_foncier = 1 THEN 1 ELSE 0 END) as withTF,
        SUM(CASE WHEN a_cloture = 1 THEN 1 ELSE 0 END) as withCloture
      FROM tmpfosa
      GROUP BY statut_rec
      ORDER BY total DESC
    `,
      { type: QueryTypes.SELECT }
    );

    // Bâtiments par FOSA (top 10)
    const buildingsByFosa = await sequelize.query(
      `
      SELECT
        f.nom as fosaName,
        f.cat_rec as category,
        COUNT(b.id) as buildingCount
      FROM tmpfosa f
      LEFT JOIN batiments b ON f.id = b.fosa_id
      GROUP BY f.id, f.nom, f.cat_rec
      HAVING buildingCount > 0
      ORDER BY buildingCount DESC
      LIMIT 10
    `,
      { type: QueryTypes.SELECT }
    );

    // Véhicules par type et énergie
    const vehiclesByTypeEnergy = await sequelize.query(
      `
      SELECT
        COALESCE(type_vehicule, type, 'Non spécifié') as vehicleType,
        COALESCE(energie, 'Non spécifié') as energy,
        COUNT(*) as count,
        SUM(quantite) as totalQuantity
      FROM materielroulants
      GROUP BY vehicleType, energie
      ORDER BY count DESC
    `,
      { type: QueryTypes.SELECT }
    );

    // Personnel par catégorie et FOSA
    const personnelDistribution = await sequelize.query(
      `
      SELECT
        c.nom as category,
        COUNT(p.id) as count,
        COUNT(DISTINCT p.fosa_id) as fosasCount
      FROM personnels p
      LEFT JOIN categories c ON p.categorie_id = c.id
      GROUP BY c.nom
      ORDER BY count DESC
    `,
      { type: QueryTypes.SELECT }
    );

    // FOSA avec sécurité (TF et Clôture)
    const securityStats = await sequelize.query(
      `
      SELECT
        SUM(CASE WHEN a_titre_foncier = 1 AND a_cloture = 1 THEN 1 ELSE 0 END) as \`both\`,
        SUM(CASE WHEN a_titre_foncier = 1 AND a_cloture = 0 THEN 1 ELSE 0 END) as tfOnly,
        SUM(CASE WHEN a_titre_foncier = 0 AND a_cloture = 1 THEN 1 ELSE 0 END) as clotureOnly,
        SUM(CASE WHEN a_titre_foncier = 0 AND a_cloture = 0 THEN 1 ELSE 0 END) as neither,
        COUNT(*) as total
      FROM tmpfosa
    `,
      { type: QueryTypes.SELECT }
    );

    return {
      fosasByCategory: fosasByCategoryQuery,
      fosasByStatus: fosasByStatusQuery,
      buildingsByFosa,
      vehiclesByTypeEnergy,
      personnelDistribution,
      securityStats: (securityStats[0] as any) || {},
    };
  }
}
