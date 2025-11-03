import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Arrondissement extends Model {
  declare id: number
  declare nom: string
  declare superficie: number | null
  declare fit1: number
  declare fit2: number
  declare fit3: number
  declare fit4: number
  declare division: string
  declare geom: Buffer | null
  declare departementId: number
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

Arrondissement.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(191),
      allowNull: false,
      comment: "Nom de l'arrondissement (mappé depuis la colonne commune)",
    },
    superficie: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: true,
    },
    fit1: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
      defaultValue: 0,
    },
    fit2: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
      defaultValue: 0,
    },
    fit3: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
      defaultValue: 0,
    },
    fit4: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
      defaultValue: 0,
    },
    division: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    geom: {
      type: DataTypes.GEOMETRY,
      allowNull: true,
      comment: "Coordonnées géométriques pour l'affichage sur carte (polygone)",
    },
    departementId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "departement_id",
      references: {
        model: "departements",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "arrondissements",
    timestamps: true,
  },
)

export default Arrondissement
