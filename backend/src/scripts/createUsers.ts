import bcrypt from "bcryptjs"
import sequelize from "../config/database"
import { User } from "../models/User"
import { logger } from "../config/logger"

async function createUsers() {
  try {
    logger.info("Creating default users...")

    await sequelize.authenticate()
    await sequelize.sync({ alter: true })

    const hashedPassword = await bcrypt.hash("Admin@2024", 10)

    const users = await User.bulkCreate([
      {
        email: "superadmin@health.cm",
        password: hashedPassword,
        firstName: "Super",
        lastName: "Admin",
        role: "super_admin",
        scopeType: "national",
        isActive: true,
      },
      {
        email: "admin@health.cm",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        scopeType: "national",
        isActive: true,
      },
      {
        email: "manager@health.cm",
        password: hashedPassword,
        firstName: "Manager",
        lastName: "User",
        role: "manager",
        scopeType: "national",
        isActive: true,
      },
      {
        email: "user@health.cm",
        password: hashedPassword,
        firstName: "Regular",
        lastName: "User",
        role: "user",
        scopeType: "national",
        isActive: true,
      },
    ] as any)

    logger.info(`Created ${users.length} users`)
    logger.info("All users have password: Admin@2024")
    logger.info("\nUsers created:")
    users.forEach(u => {
      logger.info(`- ${u.email} (${u.role})`)
    })

    await sequelize.close()
    process.exit(0)
  } catch (error) {
    logger.error("Error:", error)
    process.exit(1)
  }
}

createUsers()
