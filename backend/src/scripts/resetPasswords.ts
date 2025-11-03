import bcrypt from "bcryptjs"
import sequelize from "../config/database"
import { User } from "../models/User"
import { logger } from "../config/logger"

async function resetAllPasswords() {
  try {
    logger.info("Connecting to database...")
    await sequelize.authenticate()
    logger.info("Connected successfully!")

    const correctPassword = "Admin@2024"
    const hashedPassword = await bcrypt.hash(correctPassword, 10)

    logger.info(`New password hash: ${hashedPassword}`)

    // Update ALL users with SQL to bypass hooks
    const [results] = await sequelize.query(
      "UPDATE users SET password = :password WHERE 1=1",
      {
        replacements: { password: hashedPassword },
      }
    )

    logger.info(`Updated passwords for all users`)

    // Verify
    const users = await User.findAll({
      attributes: ["email", "password"],
    })

    logger.info("\nVerifying passwords:")
    for (const user of users) {
      const isValid = await bcrypt.compare(correctPassword, user.password)
      logger.info(`${user.email}: ${isValid ? "✓ VALID" : "✗ INVALID"}`)
    }

    await sequelize.close()
    logger.info("\nDone! All passwords reset to: Admin@2024")
    process.exit(0)
  } catch (error) {
    logger.error("Error:", error)
    process.exit(1)
  }
}

resetAllPasswords()
