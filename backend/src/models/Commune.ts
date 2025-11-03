import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Commune extends Model {
  declare id: number
  declare departementId: number
  declare commune: string
  declare superficie: number | null
  declare fit1: number
  declare fit2: number
  declare fit3: number
  declare fit4: number
  declare division: string
  declare geom: any | null
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

Commune.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
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
    commune: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    superficie: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: true,
    },
    fit1: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
    },
    fit2: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
    },
    fit3: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
    },
    fit4: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "createdAt",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updatedAt",
    },
  },
  {
    sequelize,
    tableName: "communes",
    timestamps: true,
  },
)

export default Commune
