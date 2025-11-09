import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

export class Airesante extends Model {
  public id!: number;
  public nom_as?: string;
  public nom_dist?: string;
  public code_as?: string;
  public area?: number;
  public geom?: any;
  public districtId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Airesante.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nom_as: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nom_dist: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    code_as: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    area: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    geom: {
      type: DataTypes.GEOMETRY,
      allowNull: true,
    },
    districtId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "district_id",
      references: {
        model: "districts",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "airesantes",
    timestamps: true,
  }
);

export default Airesante;
