/**
 * =============================================================================
 * Database Initializer - Auto-setup on First Run
 * =============================================================================
 * This module automatically initializes the database with:
 * - Roles and Permissions (RBAC system)
 * - Default admin users
 * - Geographic data (regions, departments, etc.)
 *
 * It runs automatically on first application startup and is idempotent
 * (safe to run multiple times - will skip if data already exists)
 * =============================================================================
 */

import { logger } from "../config/logger"
import sequelize from "../config/database"
import { setupAssociations } from "../models"
import Permission from "../models/Permission"
import Role from "../models/Role"
import RolePermission from "../models/RolePermission"
import User from "../models/User"
import bcrypt from "bcryptjs"

/**
 * Check if the database has been initialized
 */
async function isInitialized(): Promise<boolean> {
  try {
    const roleCount = await Role.count()
    const permissionCount = await Permission.count()
    const userCount = await User.count()

    return roleCount > 0 && permissionCount > 0 && userCount > 0
  } catch (error) {
    logger.error("Error checking initialization status:", error)
    return false
  }
}

/**
 * Initialize Permissions
 */
async function initializePermissions(): Promise<Permission[]> {
  logger.info("🔐 Initializing permissions...")

  const permissionsData = [
    // User Management
    { name: "users.create", resource: "users", action: "create", description: "Créer des utilisateurs" },
    { name: "users.read", resource: "users", action: "read", description: "Consulter les utilisateurs" },
    { name: "users.update", resource: "users", action: "update", description: "Modifier les utilisateurs" },
    { name: "users.delete", resource: "users", action: "delete", description: "Supprimer les utilisateurs" },
    { name: "users.manage", resource: "users", action: "manage", description: "Gestion complète des utilisateurs" },

    // Regions
    { name: "regions.create", resource: "regions", action: "create", description: "Créer des régions" },
    { name: "regions.read", resource: "regions", action: "read", description: "Consulter les régions" },
    { name: "regions.update", resource: "regions", action: "update", description: "Modifier les régions" },
    { name: "regions.delete", resource: "regions", action: "delete", description: "Supprimer les régions" },

    // Departments
    { name: "departements.create", resource: "departements", action: "create", description: "Créer des départements" },
    { name: "departements.read", resource: "departements", action: "read", description: "Consulter les départements" },
    { name: "departements.update", resource: "departements", action: "update", description: "Modifier les départements" },
    { name: "departements.delete", resource: "departements", action: "delete", description: "Supprimer les départements" },

    // Arrondissements
    { name: "arrondissements.create", resource: "arrondissements", action: "create", description: "Créer des arrondissements" },
    { name: "arrondissements.read", resource: "arrondissements", action: "read", description: "Consulter les arrondissements" },
    { name: "arrondissements.update", resource: "arrondissements", action: "update", description: "Modifier les arrondissements" },
    { name: "arrondissements.delete", resource: "arrondissements", action: "delete", description: "Supprimer les arrondissements" },

    // Districts
    { name: "districts.create", resource: "districts", action: "create", description: "Créer des districts" },
    { name: "districts.read", resource: "districts", action: "read", description: "Consulter les districts" },
    { name: "districts.update", resource: "districts", action: "update", description: "Modifier les districts" },
    { name: "districts.delete", resource: "districts", action: "delete", description: "Supprimer les districts" },

    // Aires de Santé
    { name: "airesante.create", resource: "airesante", action: "create", description: "Créer des aires de santé" },
    { name: "airesante.read", resource: "airesante", action: "read", description: "Consulter les aires de santé" },
    { name: "airesante.update", resource: "airesante", action: "update", description: "Modifier les aires de santé" },
    { name: "airesante.delete", resource: "airesante", action: "delete", description: "Supprimer les aires de santé" },

    // FOSA
    { name: "fosas.create", resource: "fosas", action: "create", description: "Créer des FOSA" },
    { name: "fosas.read", resource: "fosas", action: "read", description: "Consulter les FOSA" },
    { name: "fosas.update", resource: "fosas", action: "update", description: "Modifier les FOSA" },
    { name: "fosas.delete", resource: "fosas", action: "delete", description: "Supprimer les FOSA" },

    // Batiments
    { name: "batiments.create", resource: "batiments", action: "create", description: "Créer des bâtiments" },
    { name: "batiments.read", resource: "batiments", action: "read", description: "Consulter les bâtiments" },
    { name: "batiments.update", resource: "batiments", action: "update", description: "Modifier les bâtiments" },
    { name: "batiments.delete", resource: "batiments", action: "delete", description: "Supprimer les bâtiments" },

    // Services
    { name: "services.create", resource: "services", action: "create", description: "Créer des services" },
    { name: "services.read", resource: "services", action: "read", description: "Consulter les services" },
    { name: "services.update", resource: "services", action: "update", description: "Modifier les services" },
    { name: "services.delete", resource: "services", action: "delete", description: "Supprimer les services" },

    // Personnel
    { name: "personnels.create", resource: "personnels", action: "create", description: "Créer du personnel" },
    { name: "personnels.read", resource: "personnels", action: "read", description: "Consulter le personnel" },
    { name: "personnels.update", resource: "personnels", action: "update", description: "Modifier le personnel" },
    { name: "personnels.delete", resource: "personnels", action: "delete", description: "Supprimer le personnel" },

    // Equipements
    { name: "equipements.create", resource: "equipements", action: "create", description: "Créer des équipements" },
    { name: "equipements.read", resource: "equipements", action: "read", description: "Consulter les équipements" },
    { name: "equipements.update", resource: "equipements", action: "update", description: "Modifier les équipements" },
    { name: "equipements.delete", resource: "equipements", action: "delete", description: "Supprimer les équipements" },

    // Equipements Biomédicaux
    { name: "equipebio.create", resource: "equipebio", action: "create", description: "Créer des équipements biomédicaux" },
    { name: "equipebio.read", resource: "equipebio", action: "read", description: "Consulter les équipements biomédicaux" },
    { name: "equipebio.update", resource: "equipebio", action: "update", description: "Modifier les équipements biomédicaux" },
    { name: "equipebio.delete", resource: "equipebio", action: "delete", description: "Supprimer les équipements biomédicaux" },

    // Matériel Roulant
    { name: "materielroulant.create", resource: "materielroulant", action: "create", description: "Créer du matériel roulant" },
    { name: "materielroulant.read", resource: "materielroulant", action: "read", description: "Consulter le matériel roulant" },
    { name: "materielroulant.update", resource: "materielroulant", action: "update", description: "Modifier le matériel roulant" },
    { name: "materielroulant.delete", resource: "materielroulant", action: "delete", description: "Supprimer le matériel roulant" },

    // Audit
    { name: "audit.read", resource: "audit", action: "read", description: "Consulter les logs d'audit" },
    { name: "audit.manage", resource: "audit", action: "manage", description: "Gérer les logs d'audit" },

    // Statistics
    { name: "statistics.read", resource: "statistics", action: "read", description: "Consulter les statistiques" },
    { name: "statistics.export", resource: "statistics", action: "export", description: "Exporter les statistiques" },
  ]

  const permissions: Permission[] = []

  for (const permData of permissionsData) {
    const [permission, created] = await Permission.findOrCreate({
      where: { name: permData.name },
      defaults: permData,
    })
    permissions.push(permission)
    if (created) {
      logger.debug(`  ✓ Created permission: ${permData.name}`)
    }
  }

  logger.info(`✅ Initialized ${permissions.length} permissions`)
  return permissions
}

/**
 * Initialize Roles
 */
async function initializeRoles(): Promise<Role[]> {
  logger.info("👥 Initializing roles...")

  const rolesData = [
    {
      name: "Super Administrateur",
      code: "super_admin",
      description: "Accès complet au système sans restriction",
      level: 4,
    },
    {
      name: "Administrateur",
      code: "admin",
      description: "Gestion administrative complète du système",
      level: 3,
    },
    {
      name: "Gestionnaire",
      code: "manager",
      description: "Gestion des FOSA et ressources dans sa zone",
      level: 2,
    },
    {
      name: "Utilisateur",
      code: "user",
      description: "Consultation des données uniquement",
      level: 1,
    },
  ]

  const roles: Role[] = []

  for (const roleData of rolesData) {
    const [role, created] = await Role.findOrCreate({
      where: { code: roleData.code },
      defaults: roleData,
    })
    roles.push(role)
    if (created) {
      logger.debug(`  ✓ Created role: ${roleData.name}`)
    }
  }

  logger.info(`✅ Initialized ${roles.length} roles`)
  return roles
}

/**
 * Assign Permissions to Roles
 */
async function assignRolePermissions(
  roles: Role[],
  permissions: Permission[]
): Promise<void> {
  logger.info("🔗 Assigning permissions to roles...")

  const superAdmin = roles.find((r) => r.code === "super_admin")!
  const admin = roles.find((r) => r.code === "admin")!
  const manager = roles.find((r) => r.code === "manager")!
  const user = roles.find((r) => r.code === "user")!

  // Super Admin: ALL permissions
  const superAdminPerms = permissions.map((p) => ({
    roleId: superAdmin.id,
    permissionId: p.id,
  }))

  // Admin: All except user management
  const adminPerms = permissions
    .filter(
      (p) =>
        !p.name.startsWith("users.create") &&
        !p.name.startsWith("users.delete") &&
        !p.name.startsWith("users.manage")
    )
    .map((p) => ({
      roleId: admin.id,
      permissionId: p.id,
    }))

  // Manager: Read all + CRUD for FOSA, batiments, services, personnel, equipment
  const managerPerms = permissions
    .filter(
      (p) =>
        p.action === "read" ||
        p.resource === "fosas" ||
        p.resource === "batiments" ||
        p.resource === "services" ||
        p.resource === "personnels" ||
        p.resource === "equipements" ||
        p.resource === "equipebio" ||
        p.resource === "materielroulant"
    )
    .map((p) => ({
      roleId: manager.id,
      permissionId: p.id,
    }))

  // User: Read-only permissions (except users and audit)
  const userPerms = permissions
    .filter((p) => p.action === "read" && !["users", "audit"].includes(p.resource))
    .map((p) => ({
      roleId: user.id,
      permissionId: p.id,
    }))

  // Insert all role-permission associations (ignore duplicates)
  const allAssociations = [
    ...superAdminPerms,
    ...adminPerms,
    ...managerPerms,
    ...userPerms,
  ]

  for (const assoc of allAssociations) {
    await RolePermission.findOrCreate({
      where: assoc,
      defaults: assoc,
    })
  }

  logger.info(`  ✓ Super Admin: ${superAdminPerms.length} permissions`)
  logger.info(`  ✓ Admin: ${adminPerms.length} permissions`)
  logger.info(`  ✓ Manager: ${managerPerms.length} permissions`)
  logger.info(`  ✓ User: ${userPerms.length} permissions`)
  logger.info("✅ Role-Permission associations created")
}

/**
 * Initialize Default Users
 */
async function initializeUsers(): Promise<void> {
  logger.info("👤 Initializing default users...")

  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@2024"
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  const usersData = [
    {
      email: "superadmin@minsante.cm",
      password: hashedPassword,
      firstName: "Super",
      lastName: "Administrateur",
      role: "super_admin",
      scopeType: "national",
      isActive: true,
    },
    {
      email: "admin@minsante.cm",
      password: hashedPassword,
      firstName: "Administrateur",
      lastName: "Système",
      role: "admin",
      scopeType: "national",
      isActive: true,
    },
    {
      email: "manager@minsante.cm",
      password: hashedPassword,
      firstName: "Gestionnaire",
      lastName: "Test",
      role: "manager",
      scopeType: "regional",
      isActive: true,
    },
    {
      email: "user@minsante.cm",
      password: hashedPassword,
      firstName: "Utilisateur",
      lastName: "Test",
      role: "user",
      scopeType: "national",
      isActive: true,
    },
  ]

  for (const userData of usersData) {
    const [user, created] = await User.findOrCreate({
      where: { email: userData.email },
      defaults: userData,
    })

    if (created) {
      logger.info(`  ✓ Created user: ${userData.email} (role: ${userData.role})`)
    } else {
      logger.debug(`  - User already exists: ${userData.email}`)
    }
  }

  logger.info("✅ Default users initialized")
  logger.info("")
  logger.info("📧 Default Login Credentials:")
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  logger.info(`  Super Admin: superadmin@minsante.cm`)
  logger.info(`  Admin:       admin@minsante.cm`)
  logger.info(`  Manager:     manager@minsante.cm`)
  logger.info(`  User:        user@minsante.cm`)
  logger.info(`  Password:    ${defaultPassword}`)
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  logger.info("")
  logger.warn("⚠️  IMPORTANT: Changez ces mots de passe en production!")
  logger.info("")
}

/**
 * Main initialization function
 * This function is idempotent and safe to run multiple times
 */
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info("")
    logger.info("╔═══════════════════════════════════════════════════════════╗")
    logger.info("║   Database Initialization - First Run Setup              ║")
    logger.info("╚═══════════════════════════════════════════════════════════╝")
    logger.info("")

    // Check if already initialized
    const initialized = await isInitialized()

    if (initialized) {
      logger.info("✅ Database already initialized. Skipping setup.")
      return
    }

    logger.info("🚀 Starting first-time database initialization...")
    logger.info("")

    // Setup model associations
    setupAssociations()

    // Initialize in order
    const permissions = await initializePermissions()
    const roles = await initializeRoles()
    await assignRolePermissions(roles, permissions)
    await initializeUsers()

    logger.info("╔═══════════════════════════════════════════════════════════╗")
    logger.info("║   ✅ Database Initialization Complete!                    ║")
    logger.info("╚═══════════════════════════════════════════════════════════╝")
    logger.info("")
  } catch (error) {
    logger.error("❌ Database initialization failed:", error)
    throw error
  }
}

/**
 * Force re-initialization (USE WITH CAUTION!)
 * This will delete all existing data and recreate everything
 */
export async function reinitializeDatabase(): Promise<void> {
  logger.warn("")
  logger.warn("⚠️  WARNING: Force re-initialization requested!")
  logger.warn("⚠️  This will DELETE all existing data!")
  logger.warn("")

  try {
    // Sync with force (drops and recreates tables)
    await sequelize.sync({ force: true })
    logger.info("Database tables recreated")

    // Run initialization
    await initializeDatabase()
  } catch (error) {
    logger.error("❌ Re-initialization failed:", error)
    throw error
  }
}
