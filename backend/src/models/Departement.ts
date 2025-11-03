import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Departement extends Model {
  declare id: number
  declare regionId: number
  declare departement: string
  declare fit1: number
  declare fit2: number
  declare fit3: number
  declare fit4: number
  declare geom: any | null
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

Departement.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    regionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "region_id",
      references: {
        model: "regions",
        key: "id",
      },
    },
    departement: {
      type: DataTypes.STRING(191),
      allowNull: false,
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
    tableName: "departements",
    timestamps: true,
  },
)

export default Departement
