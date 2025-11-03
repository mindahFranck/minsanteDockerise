#!/usr/bin/env tsx

/**
 * =============================================================================
 * Database Initialization CLI
 * =============================================================================
 * Command-line tool for managing database initialization
 *
 * Usage:
 *   npm run init-db              # Initialize if not already done
 *   npm run init-db -- --force   # Force re-initialization (DANGER!)
 *   npm run init-db -- --help    # Show help
 * =============================================================================
 */

import dotenv from "dotenv"
import { logger } from "../config/logger"
import sequelize from "../config/database"
import { initializeDatabase, reinitializeDatabase } from "../database/initializer"

// Load environment variables
dotenv.config()

interface CLIOptions {
  force?: boolean
  help?: boolean
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2)
  const options: CLIOptions = {}

  for (const arg of args) {
    if (arg === "--force" || arg === "-f") {
      options.force = true
    } else if (arg === "--help" || arg === "-h") {
      options.help = true
    }
  }

  return options
}

function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   Database Initialization CLI                             ║
╚═══════════════════════════════════════════════════════════╝

Usage:
  npm run init-db [options]

Options:
  (none)          Initialize database if not already done (safe)
  --force, -f     Force re-initialization - DELETES ALL DATA!
  --help, -h      Show this help message

Examples:
  npm run init-db              # Safe initialization
  npm run init-db -- --force   # Force reset (DANGER!)

What it does:
  ✓ Creates all necessary permissions (60+ permissions)
  ✓ Creates roles (Super Admin, Admin, Manager, User)
  ✓ Assigns permissions to roles
  ✓ Creates default admin users

Default Users Created:
  superadmin@minsante.cm  - Super Administrateur
  admin@minsante.cm       - Administrateur
  manager@minsante.cm     - Gestionnaire
  user@minsante.cm        - Utilisateur

Default Password: Admin@2024
(Set DEFAULT_ADMIN_PASSWORD in .env to change)

⚠️  WARNING: --force will DELETE ALL existing data!
`)
}

async function main() {
  const options = parseArgs()

  if (options.help) {
    showHelp()
    process.exit(0)
  }

  try {
    logger.info("Connecting to database...")
    await sequelize.authenticate()
    logger.info("✓ Database connection established")

    if (options.force) {
      logger.warn("")
      logger.warn("╔════════════════════════════════════════════════════╗")
      logger.warn("║   ⚠️  FORCE RE-INITIALIZATION MODE                ║")
      logger.warn("║   This will DELETE ALL existing data!             ║")
      logger.warn("╚════════════════════════════════════════════════════╝")
      logger.warn("")

      // Ask for confirmation
      console.log("Type 'YES' to confirm data deletion:")

      // Simple confirmation without readline
      const confirmation = process.env.FORCE_CONFIRM || "NO"

      if (confirmation !== "YES") {
        logger.info("Operation cancelled.")
        logger.info("To force re-initialization, run:")
        logger.info("  FORCE_CONFIRM=YES npm run init-db -- --force")
        process.exit(0)
      }

      logger.warn("Proceeding with force re-initialization...")
      await reinitializeDatabase()
    } else {
      // Normal initialization (idempotent)
      await initializeDatabase()
    }

    logger.info("")
    logger.info("✅ Initialization complete!")
    logger.info("")
    logger.info("Next steps:")
    logger.info("  1. Start the server: npm run dev")
    logger.info("  2. Login with: superadmin@minsante.cm / Admin@2024")
    logger.info("  3. Change default passwords immediately!")
    logger.info("")

    process.exit(0)
  } catch (error) {
    logger.error("❌ Initialization failed:", error)
    process.exit(1)
  }
}

// Handle unhandled rejections
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled rejection:", error)
  process.exit(1)
})

// Run main function
main()
