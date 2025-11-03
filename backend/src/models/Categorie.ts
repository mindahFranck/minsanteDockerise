import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Categorie extends Model {
  public id!: number
  public nom!: string
  public type?: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Categorie.init(
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "categories",
    timestamps: true,
  },
)

export default Categorie
