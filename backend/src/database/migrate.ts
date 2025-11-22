import sequelize from "../config/database"
import { setupAssociations } from "../models"
import { promises as fs } from "fs"
import path from "path"

async function migrate() {
  try {
    console.log("[v0] Starting database migration...")

    // Setup model associations
    setupAssociations()

    // Exécuter les fichiers de migration
    const migrationsDir = path.join(__dirname, "../../database/migrations")
    const migrationFiles = await fs.readdir(migrationsDir)

    for (const file of migrationFiles.sort()) {
      if (file.endsWith(".ts") || file.endsWith(".js")) {
        console.log(`[v0] Running migration: ${file}`)
        const migration = await import(path.join(migrationsDir, file))
        if (migration.default && migration.default.up) {
          await migration.default.up(sequelize.getQueryInterface())
          console.log(`[v0] ✓ Completed: ${file}`)
        }
      }
    }

    console.log("[v0] Database migration completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("[v0] Migration failed:", error)
    process.exit(1)
  }
}

migrate()
