import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    // Ajouter les nouveaux champs à la table materielroulants
    await queryInterface.addColumn("materielroulants", "date_mise_service", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("materielroulants", "acte_affectation", {
      type: DataTypes.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("materielroulants", "type_vehicule", {
      type: DataTypes.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("materielroulants", "immatriculation", {
      type: DataTypes.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn("materielroulants", "usage", {
      type: DataTypes.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("materielroulants", "code", {
      type: DataTypes.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn("materielroulants", "structure", {
      type: DataTypes.STRING(200),
      allowNull: true,
    });

    await queryInterface.addColumn("materielroulants", "service_id", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "services",
        key: "id",
      },
    });

    await queryInterface.addColumn("materielroulants", "nom_utilisateur", {
      type: DataTypes.STRING(200),
      allowNull: true,
    });

    await queryInterface.addColumn("materielroulants", "fonction_utilisateur", {
      type: DataTypes.STRING(200),
      allowNull: true,
    });

    await queryInterface.addColumn("materielroulants", "energie", {
      type: DataTypes.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn("materielroulants", "financement", {
      type: DataTypes.STRING(200),
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Supprimer les colonnes en cas de rollback
    await queryInterface.removeColumn("materielroulants", "date_mise_service");
    await queryInterface.removeColumn("materielroulants", "acte_affectation");
    await queryInterface.removeColumn("materielroulants", "type_vehicule");
    await queryInterface.removeColumn("materielroulants", "immatriculation");
    await queryInterface.removeColumn("materielroulants", "usage");
    await queryInterface.removeColumn("materielroulants", "code");
    await queryInterface.removeColumn("materielroulants", "structure");
    await queryInterface.removeColumn("materielroulants", "service_id");
    await queryInterface.removeColumn("materielroulants", "nom_utilisateur");
    await queryInterface.removeColumn("materielroulants", "fonction_utilisateur");
    await queryInterface.removeColumn("materielroulants", "energie");
    await queryInterface.removeColumn("materielroulants", "financement");
  },
};
