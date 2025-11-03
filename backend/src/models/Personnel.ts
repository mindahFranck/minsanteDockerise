import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Personnel extends Model {
  public id!: number
  public nom!: string
  public prenom!: string
  public matricule?: string
  public grade?: string
  public fosaId!: number
  public categorieId?: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Personnel.init(
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
    prenom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    matricule: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    grade: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fosaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "fosa_id",
      references: {
        model: "fosas",
        key: "id",
      },
    },
    categorieId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "categorie_id",
      references: {
        model: "categories",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "personnels",
    timestamps: true,
  },
)

export default Personnel
