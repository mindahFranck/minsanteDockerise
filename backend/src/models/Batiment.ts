import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Batiment extends Model {
  public id!: number
  public nom?: string
  public type?: string
  public etat?: string
  public fosaId!: number
  public degradationId?: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // Relations
  public readonly fosa?: any
  public readonly degradation?: any
}

Batiment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(200),
      allowNull: true,
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
