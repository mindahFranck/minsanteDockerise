import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Materielroulant extends Model {
  public id!: number
  public numeroChassis?: string
  public annee?: number
  public marque?: string
  public modele?: string
  public type?: string
  public fosaId!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Materielroulant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    numeroChassis: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      field: "numero_chassis",
    },
    annee: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    marque: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    modele: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    type: {
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
  },
  {
    sequelize,
    tableName: "materielroulants",
    timestamps: true,
  },
)
