import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export interface PermissionAttributes {
  id: number
  name: string
  resource: string
  action: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export class Permission extends Model<PermissionAttributes> implements PermissionAttributes {
  declare id: number
  declare name: string
  declare resource: string
  declare action: string
  declare description?: string
  declare readonly createdAt: Date
  declare readonly updatedAt: Date
}

Permission.init(
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
      comment: "Nom de la permission (ex: users.create, fosas.read)",
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Ressource concernée (users, fosas, regions, etc.)",
    },
    action: {
      type: DataTypes.ENUM("create", "read", "update", "delete", "manage"),
      allowNull: false,
      comment: "Action autorisée",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Description de la permission",
    },
  },
  {
    sequelize,
    tableName: "permissions",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["resource", "action"],
      },
    ],
  }
)

export default Permission
