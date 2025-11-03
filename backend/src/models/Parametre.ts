import { Model, DataTypes } from "sequelize"
import sequelize from "../config/database"

export class Parametre extends Model {
  public id!: number
  public nombrePatientsAmbulants?: number
  public nombrePatientsTotaux?: number
  public listeOperationnelle?: string
  public date?: Date
  public fosaId!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Parametre.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombrePatientsAmbulants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nombre_patients_ambulants",
    },
    nombrePatientsTotaux: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "nombre_patients_totaux",
    },
    listeOperationnelle: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "liste_operationnelle",
    },
    date: {
      type: DataTypes.DATE,
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
  },
  {
    sequelize,
    tableName: "parametres",
    timestamps: true,
  },
)
