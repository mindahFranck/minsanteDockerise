import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class District extends Model {
  public id!: number
  public nom!: string
  public responsable?: string
  public population?: number
  public superficie?: number
  public sitesDisponibles?: number
  public sitesTotaux?: number
  public regionId!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

District.init(
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
    population: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    superficie: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    sitesDisponibles: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "sites_disponibles",
    },
    sitesTotaux: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "sites_totaux",
    },
    regionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "region_id",
      references: {
        model: "regions",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "districts",
    timestamps: true,
  },
)

export default District
