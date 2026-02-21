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
  database: process.env.DB_NAME || "u877916646_minstante",
  username: process.env.DB_USER || "u877916646_minsante",
  password: process.env.DB_PASSWORD || "itgrafik@Dev12",
  dialect: "mysql",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  dialectOptions: {
    connectTimeout: 60000, // 60 secondes pour la connexion initiale
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 60000, // Augmenté à 60 secondes pour serveur distant
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
});

export default sequelize;
