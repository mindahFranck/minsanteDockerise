import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"
import bcrypt from "bcryptjs"

export interface UserAttributes {
  id: number
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  lastLogin?: Date
  scopeType?: "national" | "regional" | "departemental" | "arrondissement"
  regionId?: number
  departementId?: number
  arrondissementId?: number
  createdAt: Date
  updatedAt: Date
}

export class User extends Model<UserAttributes> implements UserAttributes {
  declare id: number
  declare email: string
  declare password: string
  declare firstName: string
  declare lastName: string
  declare role: string
  declare isActive: boolean
  declare lastLogin?: Date
  declare scopeType?: "national" | "regional" | "departemental" | "arrondissement"
  declare regionId?: number
  declare departementId?: number
  declare arrondissementId?: number
  declare readonly createdAt: Date
  declare readonly updatedAt: Date

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  public canAccessRegion(regionId: number): boolean {
    if (this.scopeType === "national") return true
    if (this.scopeType === "regional") return this.regionId === regionId
    return false
  }

  public canAccessDepartement(departementId: number, regionId?: number): boolean {
    if (this.scopeType === "national") return true
    if (this.scopeType === "regional" && regionId) return this.regionId === regionId
    if (this.scopeType === "departemental") return this.departementId === departementId
    return false
  }

  public canAccessArrondissement(arrondissementId: number, departementId?: number, regionId?: number): boolean {
    if (this.scopeType === "national") return true
    if (this.scopeType === "regional" && regionId) return this.regionId === regionId
    if (this.scopeType === "departemental" && departementId) return this.departementId === departementId
    if (this.scopeType === "arrondissement") return this.arrondissementId === arrondissementId
    return false
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "last_name",
    },
    role: {
      type: DataTypes.ENUM("super_admin", "admin", "manager", "user"),
      allowNull: false,
      defaultValue: "user",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_login",
    },
    scopeType: {
      type: DataTypes.ENUM("national", "regional", "departemental", "arrondissement"),
      allowNull: true,
      defaultValue: "national",
      field: "scope_type",
      comment: "Portée géographique de l'utilisateur",
    },
    regionId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "region_id",
      references: {
        model: "regions",
        key: "id",
      },
      comment: "Région de l'utilisateur (si scope régional)",
    },
    departementId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "departement_id",
      references: {
        model: "departements",
        key: "id",
      },
      comment: "Département de l'utilisateur (si scope départemental)",
    },
    arrondissementId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "arrondissement_id",
      references: {
        model: "arrondissements",
        key: "id",
      },
      comment: "Arrondissement de l'utilisateur (si scope arrondissement)",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10)
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 10)
        }
      },
    },
  },
)

export default User
