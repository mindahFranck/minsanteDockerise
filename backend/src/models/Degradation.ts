import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Degradation extends Model {
  public id!: number
  public type!: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Degradation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "degradations",
    timestamps: true,
  },
)
