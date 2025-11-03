import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";

export interface AuditLogAttributes {
  id: number;
  userId?: number;
  action: string;
  resource: string;
  resourceId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failure";
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AuditLog
  extends Model<AuditLogAttributes>
  implements AuditLogAttributes
{
  declare id: number;
  declare userId?: number;
  declare action: string;
  declare resource: string;
  declare resourceId?: number;
  declare details?: any;
  declare ipAddress?: string;
  declare userAgent?: string;
  declare status: "success" | "failure";
  declare errorMessage?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "user_id",
      references: {
        model: "users",
        key: "id",
      },
      comment:
        "Utilisateur qui a effectué l'action (null pour les tentatives de connexion échouées)",
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Action effectuée (create, read, update, delete, login, etc.)",
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "Ressource concernée (users, fosas, regions, etc.)",
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "resource_id",
      comment: "ID de la ressource concernée",
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Détails de l'action (données modifiées, paramètres, etc.)",
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "ip_address",
      comment: "Adresse IP de l'utilisateur",
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "user_agent",
      comment: "User agent du navigateur",
    },
    status: {
      type: DataTypes.ENUM("success", "failure"),
      allowNull: false,
      defaultValue: "success",
      comment: "Statut de l'action",
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "error_message",
      comment: "Message d'erreur si l'action a échoué",
    },
    // Add these missing fields
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
    tableName: "audit_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["resource", "resource_id"],
      },
      {
        fields: ["created_at"],
      },
      {
        fields: ["action"],
      },
    ],
  }
);

export default AuditLog;
