import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Materielroulant extends Model {
  public id!: number
  public numeroChassis?: string
  public annee?: number
  public marque?: string
  public modele?: string
  public type?: string
  public dateMiseEnCirculation?: Date
  public etat?: string
  public quantite?: number
  public fosaId!: number

  // Nouveaux champs (Page 4 du document)
  public dateMiseService?: Date
  public acteAffectation?: string
  public typeVehicule?: string
  public immatriculation?: string
  public usage?: string
  public code?: string
  public structure?: string
  public serviceId?: number         // FK vers table services
  public nomUtilisateur?: string
  public fonctionUtilisateur?: string
  public energie?: string
  public financement?: string

  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // Relations
  public readonly fosa?: any
  public readonly service?: any
}

Materielroulant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    numeroChassis: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      field: "numero_chassis",
    },
    annee: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    marque: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    modele: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    dateMiseEnCirculation: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "date_mise_en_circulation",
    },
    etat: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    quantite: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    fosaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fosa_id",
      references: {
        model: "fosas",
        key: "id",
      },
    },
    // Nouveaux champs
    dateMiseService: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "date_mise_service",
    },
    acteAffectation: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "acte_affectation",
    },
    typeVehicule: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "type_vehicule",
    },
    immatriculation: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    usage: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    structure: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "service_id",
      references: {
        model: "services",
        key: "id",
      },
    },
    nomUtilisateur: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "nom_utilisateur",
    },
    fonctionUtilisateur: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: "fonction_utilisateur",
    },
    energie: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    financement: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "materielroulants",
    timestamps: true,
  },
)
