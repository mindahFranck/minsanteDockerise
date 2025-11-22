import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    // Ajouter la colonne quantite à la table materielroulants
    await queryInterface.addColumn("materielroulants", "quantite", {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Supprimer la colonne en cas de rollback
    await queryInterface.removeColumn("materielroulants", "quantite");
  },
};
