import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    // Ajouter les champs de maintenance
    await queryInterface.addColumn("tmpfosa", "last_inspection", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("tmpfosa", "next_inspection", {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("tmpfosa", "maintenance_priority", {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      allowNull: true,
      defaultValue: "low",
    });

    await queryInterface.addColumn("tmpfosa", "maintenance_issues", {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array of maintenance issues",
    });

    // Ajouter les champs de contacts
    await queryInterface.addColumn("tmpfosa", "telephone", {
      type: DataTypes.STRING(20),
      allowNull: true,
    });

    await queryInterface.addColumn("tmpfosa", "email", {
      type: DataTypes.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("tmpfosa", "responsable_nom", {
      type: DataTypes.STRING(200),
      allowNull: true,
    });

    await queryInterface.addColumn("tmpfosa", "responsable_telephone", {
      type: DataTypes.STRING(20),
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Supprimer les colonnes en cas de rollback
    await queryInterface.removeColumn("tmpfosa", "last_inspection");
    await queryInterface.removeColumn("tmpfosa", "next_inspection");
    await queryInterface.removeColumn("tmpfosa", "maintenance_priority");
    await queryInterface.removeColumn("tmpfosa", "maintenance_issues");
    await queryInterface.removeColumn("tmpfosa", "telephone");
    await queryInterface.removeColumn("tmpfosa", "email");
    await queryInterface.removeColumn("tmpfosa", "responsable_nom");
    await queryInterface.removeColumn("tmpfosa", "responsable_telephone");
  },
};
