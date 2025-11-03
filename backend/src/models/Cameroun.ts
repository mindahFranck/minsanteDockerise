import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Cameroun extends Model {
  declare id: number
  declare forme: string
  declare geom: any | null
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

Cameroun.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    forme: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Forme géographique du pays (polygon coordinates)",
    },
    geom: {
      type: DataTypes.GEOMETRY('POLYGON'),
      allowNull: true,
      comment: "Géométrie du polygone du Cameroun",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "createdAt",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updatedAt",
    },
  },
  {
    sequelize,
    tableName: "cameroun",
    timestamps: true,
  },
)

export default Cameroun
