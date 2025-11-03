import { type QueryInterface, DataTypes } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("fosas", "image", {
      type: DataTypes.STRING(500),
      allowNull: true,
    })
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("fosas", "image")
  },
}
