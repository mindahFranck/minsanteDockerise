import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Service extends Model {
  public id!: number
  public nom!: string
  public responsable?: string
  public dateCreation?: Date
  public batimentId?: number
  public fosaId?: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // Relations
  public readonly batiment?: any
  public readonly fosa?: any
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
      allowNull: true,
      field: "batiment_id",
      references: {
        model: "batiments",
        key: "id",
      },
    },
    fosaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "fosa_id",
      references: {
        model: "fosas",
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

export default Service
