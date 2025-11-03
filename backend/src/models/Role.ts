import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

export interface RoleAttributes {
  id: number;
  name: string;
  code: string;
  description?: string;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Role extends Model<RoleAttributes> implements RoleAttributes {
  declare id: number;
  declare name: string;
  declare code: string;
  declare description?: string;
  declare level: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: "Nom du rôle",
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: "Code unique du rôle (super_admin, admin, etc.)",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Description du rôle",
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment:
        "Niveau hiérarchique (plus le nombre est élevé, plus les privilèges sont importants)",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "roles",
    timestamps: true,
    underscored: true,
  }
);

export default Role;
