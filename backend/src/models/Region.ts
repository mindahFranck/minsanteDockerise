import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Region extends Model {
  declare id: number
  declare nom: string
  declare capitale: string | null
  declare population: number
  declare latitude: number
  declare longitude: number
  declare geom: any | null
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

Region.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(191),
      allowNull: false,
    },
    capitale: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    population: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DOUBLE(8, 2),
      allowNull: false,
    },
    longitude: {
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
    tableName: "regions",
    timestamps: true,
  },
)

export default Region
