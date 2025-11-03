import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Batiment extends Model {
  public id!: number
  public type?: string
  public etat?: string
  public fosaId!: number
  public degradationId?: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Batiment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    etat: {
      type: DataTypes.STRING(50),
      allowNull: true,
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
    degradationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "degradation_id",
      references: {
        model: "degradations",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "batiments",
    timestamps: true,
  },
)
