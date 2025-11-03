import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Service extends Model {
  public id!: number
  public nom!: string
  public responsable?: string
  public dateCreation?: Date
  public batimentId!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Service.init(
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
    dateCreation: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "date_creation",
    },
    batimentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "batiment_id",
      references: {
        model: "batiments",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "services",
    timestamps: true,
  },
)
