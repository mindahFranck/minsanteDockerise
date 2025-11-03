import sequelize from "../config/database"
import { setupAssociations } from "../models"

async function migrate() {
  try {
    console.log("[v0] Starting database migration...")

    // Setup model associations
    setupAssociations()

    // Sync all models
    await sequelize.sync({ alter: true })

    console.log("[v0] Database migration completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("[v0] Migration failed:", error)
    process.exit(1)
  }
}

migrate()
