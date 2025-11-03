import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Equipebio extends Model {
  public id!: number
  public type?: string
  public dateAcquisition?: Date
  public fonction?: string
  public serviceId!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Equipebio.init(
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
    dateAcquisition: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "date_acquisition",
    },
    fonction: {
      type: DataTypes.STRING(200),
      allowNull: true,
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
    tableName: "equipebios",
    timestamps: true,
  },
)
