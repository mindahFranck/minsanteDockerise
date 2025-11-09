import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Equipement extends Model {
  public id!: number
  public nom?: string
  public type?: string
  public dateAcquisition?: Date
  public serviceId!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // Relations
  public readonly service?: any
}

Equipement.init(
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
    dateAcquisition: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "date_acquisition",
    },
    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "service_id",
      references: {
        model: "services",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "equipements",
    timestamps: true,
  },
)
