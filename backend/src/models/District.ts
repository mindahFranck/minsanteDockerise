import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

export class District extends Model {
  public id!: number;
  public region?: string;
  public area?: number;
  public code_ds?: string;
  public nom_ds?: string;
  public geom?: any;
  // Anciens champs (pour compatibilité)
  public nom?: string;
  public responsable?: string;
  public population?: number;
  public superficie?: number;
  public sitesDisponibles?: number;
  public sitesTotaux?: number;
  public regionId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

District.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    region: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    area: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      comment: "Superficie du district",
    },
    code_ds: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nom_ds: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    geom: {
      type: DataTypes.GEOMETRY,
      allowNull: true,
    },
    regionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
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
  }
);

export default District;
