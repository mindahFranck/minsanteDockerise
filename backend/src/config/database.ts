import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// 👉 Ajoute ce log pour vérifier les valeurs réellement lues
console.log("🔍 Configuration Sequelize :");
console.log({
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD ? "********" : "(vide)",
});

const sequelize = new Sequelize({
  host: process.env.DB_HOST || "srv915.hstgr.io",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  database: process.env.DB_NAME || "health_management",
  username: process.env.DB_USER || "root",
  password: "itgrafik@Dev12",
  dialect: "mysql",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

export default sequelize;
