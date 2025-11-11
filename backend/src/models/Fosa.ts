import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Fosa extends Model {
  public id!: number
  public nom!: string
  public type?: string
  public capaciteLits?: number
  public estFerme?: boolean
  public situation?: string
  public image?: string
  public arrondissementId!: number
  public airesanteId!: number

  // Coordonnées
  public longitude?: number
  public latitude?: number

  // Fréquentation
  public nbreVisiteursJour?: number
  public nbrePatientsAmbulants?: number
  public nbrePatientsHospitalises?: number

  // Ressources Humaines
  public nbreMedecinsGeneralistes?: number
  public nbreMedecinsSpecialistes?: number
  public nbreInfirmiersSup?: number
  public nbreInfirmiersDe?: number
  public nbrePersonnelAppui?: number

  // Infrastructures
  public nbreTotalBatiments?: number
  public designationBatiments?: string
  public surfaceTotaleBatie?: number
  public servicesAbrités?: string
  public nbreBatimentsFonctionnels?: number
  public nbreBatimentsAbandonnes?: number
  public etatGeneralLieux?: string
  public nbreLitsOperationnels?: number
  public nbreTotalLitsDisponibles?: number
  public nbreLitsAAjouter?: number
  public nbreBatimentsMaintenanceLourde?: number
  public nbreBatimentsMaintenanceLegere?: number

  // Budgets
  public budgetTravauxNeufsAnneeMoins2?: number
  public budgetTravauxNeufsAnneeMoins1?: number
  public budgetTravauxNeufsAnneeCourante?: number
  public budgetTravauxNeufsAnneePlus1?: number
  public budgetMaintenanceAnneeMoins2?: number
  public budgetMaintenanceAnneeMoins1?: number
  public budgetMaintenanceAnneeCourante?: number
  public budgetMaintenanceAnneePlus1?: number

  // Autres infrastructures
  public connectionElectricite?: boolean
  public connectionEauPotable?: boolean
  public existenceForage?: boolean
  public existenceChateauEau?: boolean
  public existenceEnergieSolaire?: boolean
  public existenceIncinerateur?: boolean

  // Equipements
  public etatGeneralEquipements?: string
  public budgetEquipementsAnneeCourante?: number
  public budgetEquipementsAnneePlus1?: number
  public budgetEquipementsMineursAnneeCourante?: number
  public budgetEquipementsMineursAnneePlus1?: number

  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // Relations
  public readonly arrondissement?: any
  public readonly airesante?: any
}

Fosa.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    capaciteLits: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "capacite_lits",
    },
    estFerme: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: "est_ferme",
    },
    situation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    arrondissementId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "arrondissement_id",
      references: {
        model: "arrondissements",
        key: "id",
      },
    },
    airesanteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "airesante_id",
      references: {
        model: "airesantes",
        key: "id",
      },
    },
    // Coordonnées
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    // Fréquentation
    nbreVisiteursJour: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_visiteurs_jour",
    },
    nbrePatientsAmbulants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_patients_ambulants",
    },
    nbrePatientsHospitalises: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_patients_hospitalises",
    },
    // Ressources Humaines
    nbreMedecinsGeneralistes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_medecins_generalistes",
    },
    nbreMedecinsSpecialistes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_medecins_specialistes",
    },
    nbreInfirmiersSup: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_infirmiers_sup",
    },
    nbreInfirmiersDe: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_infirmiers_de",
    },
    nbrePersonnelAppui: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_personnel_appui",
    },
    // Infrastructures
    nbreTotalBatiments: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_total_batiments",
    },
    designationBatiments: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "designation_batiments",
    },
    surfaceTotaleBatie: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "surface_totale_batie",
    },
    servicesAbrités: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "services_abrités",
    },
    nbreBatimentsFonctionnels: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_batiments_fonctionnels",
    },
    nbreBatimentsAbandonnes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_batiments_abandonnes",
    },
    etatGeneralLieux: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "etat_general_lieux",
    },
    nbreLitsOperationnels: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_lits_operationnels",
    },
    nbreTotalLitsDisponibles: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_total_lits_disponibles",
    },
    nbreLitsAAjouter: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_lits_a_ajouter",
    },
    nbreBatimentsMaintenanceLourde: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_batiments_maintenance_lourde",
    },
    nbreBatimentsMaintenanceLegere: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nbre_batiments_maintenance_legere",
    },
    // Budgets
    budgetTravauxNeufsAnneeMoins2: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_travaux_neufs_annee_moins2",
    },
    budgetTravauxNeufsAnneeMoins1: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_travaux_neufs_annee_moins1",
    },
    budgetTravauxNeufsAnneeCourante: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_travaux_neufs_annee_courante",
    },
    budgetTravauxNeufsAnneePlus1: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_travaux_neufs_annee_plus1",
    },
    budgetMaintenanceAnneeMoins2: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_maintenance_annee_moins2",
    },
    budgetMaintenanceAnneeMoins1: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_maintenance_annee_moins1",
    },
    budgetMaintenanceAnneeCourante: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_maintenance_annee_courante",
    },
    budgetMaintenanceAnneePlus1: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_maintenance_annee_plus1",
    },
    // Autres infrastructures
    connectionElectricite: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "connection_electricite",
    },
    connectionEauPotable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "connection_eau_potable",
    },
    existenceForage: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "existence_forage",
    },
    existenceChateauEau: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "existence_chateau_eau",
    },
    existenceEnergieSolaire: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "existence_energie_solaire",
    },
    existenceIncinerateur: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "existence_incinerateur",
    },
    // Equipements
    etatGeneralEquipements: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "etat_general_equipements",
    },
    budgetEquipementsAnneeCourante: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_equipements_annee_courante",
    },
    budgetEquipementsAnneePlus1: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_equipements_annee_plus1",
    },
    budgetEquipementsMineursAnneeCourante: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_equipements_mineurs_annee_courante",
    },
    budgetEquipementsMineursAnneePlus1: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "budget_equipements_mineurs_annee_plus1",
    },
  },
  {
    sequelize,
    tableName: "fosas",
    timestamps: true,
  },
)

export default Fosa
