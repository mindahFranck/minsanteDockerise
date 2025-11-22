import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    // Ajouter les nouveaux champs à la table fosas
    await queryInterface.addColumn("fosas", "org_unit", {
      type: DataTypes.STRING(200),
      allowNull: true,
    });

    await queryInterface.addColumn("fosas", "fonction", {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    });

    await queryInterface.addColumn("fosas", "statut_rec", {
      type: DataTypes.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("fosas", "cat_rec", {
      type: DataTypes.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn("fosas", "nom_direct", {
      type: DataTypes.STRING(200),
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Supprimer les colonnes en cas de rollback
    await queryInterface.removeColumn("fosas", "org_unit");
    await queryInterface.removeColumn("fosas", "fonction");
    await queryInterface.removeColumn("fosas", "statut_rec");
    await queryInterface.removeColumn("fosas", "cat_rec");
    await queryInterface.removeColumn("fosas", "nom_direct");
  },
};
