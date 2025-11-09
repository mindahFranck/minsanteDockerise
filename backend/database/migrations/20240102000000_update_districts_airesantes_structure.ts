import { type QueryInterface, DataTypes } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface) => {
    // Ajouter les nouveaux champs pour Districts
    await queryInterface.addColumn("districts", "region", {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Nom de la région à laquelle appartient le district",
    })

    await queryInterface.addColumn("districts", "area", {
      type: DataTypes.DOUBLE,
      allowNull: true,
      comment: "Superficie du district",
    })

    await queryInterface.addColumn("districts", "code_ds", {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Code du district sanitaire",
    })

    await queryInterface.addColumn("districts", "nom_ds", {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Nom du district sanitaire",
    })

    await queryInterface.addColumn("districts", "geom", {
      type: DataTypes.GEOMETRY,
      allowNull: true,
      comment: "Coordonnées géométriques pour l'affichage sur carte (polygone)",
    })

    // Ajouter les nouveaux champs pour Airesantes
    await queryInterface.addColumn("airesantes", "nom_as", {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Nom de l'aire de santé",
    })

    await queryInterface.addColumn("airesantes", "nom_dist", {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Nom du district auquel appartient l'aire de santé",
    })

    await queryInterface.addColumn("airesantes", "code_as", {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Code de l'aire de santé",
    })

    await queryInterface.addColumn("airesantes", "area", {
      type: DataTypes.DOUBLE,
      allowNull: true,
      comment: "Superficie de l'aire de santé",
    })

    await queryInterface.addColumn("airesantes", "geom", {
      type: DataTypes.GEOMETRY,
      allowNull: true,
      comment: "Coordonnées géométriques pour l'affichage sur carte (polygone)",
    })
  },

  down: async (queryInterface: QueryInterface) => {
    // Supprimer les colonnes pour Districts
    await queryInterface.removeColumn("districts", "region")
    await queryInterface.removeColumn("districts", "area")
    await queryInterface.removeColumn("districts", "code_ds")
    await queryInterface.removeColumn("districts", "nom_ds")
    await queryInterface.removeColumn("districts", "geom")

    // Supprimer les colonnes pour Airesantes
    await queryInterface.removeColumn("airesantes", "nom_as")
    await queryInterface.removeColumn("airesantes", "nom_dist")
    await queryInterface.removeColumn("airesantes", "code_as")
    await queryInterface.removeColumn("airesantes", "area")
    await queryInterface.removeColumn("airesantes", "geom")
  },
}
