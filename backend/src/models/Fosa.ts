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

  // Questions OUI/NON
  public aCloture?: boolean
  public aTitreFoncier?: boolean
  public connecteeElectricite?: boolean
  public typeCourant?: string

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
    // Questions OUI/NON
    aCloture: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "a_cloture",
    },
    aTitreFoncier: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "a_titre_foncier",
    },
    connecteeElectricite: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: "connectee_electricite",
    },
    typeCourant: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "type_courant",
    },
  },
  {
    sequelize,
    tableName: "fosas",
    timestamps: true,
  },
)

export default Fosa
