import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Airesante extends Model {
  public id!: number
  public nom!: string
  public responsable?: string
  public contact?: string
  public districtId!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Airesante.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    responsable: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    contact: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    districtId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "district_id",
      references: {
        model: "districts",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "airesantes",
    timestamps: true,
  },
)

export default Airesante
