import sequelize from "../../config/database"
import { setupAssociations } from "../../models"
import User from "../../models/User"
import Region from "../../models/Region"
import Departement from "../../models/Departement"
import Arrondissement from "../../models/Arrondissement"
import District from "../../models/District"
import Airesante from "../../models/Airesante"
import Fosa from "../../models/Fosa"
import Categorie from "../../models/Categorie"
import Personnel from "../../models/Personnel"
import Permission from "../../models/Permission"
import Role from "../../models/Role"
import RolePermission from "../../models/RolePermission"
import bcrypt from "bcryptjs"
import { logger } from "../../config/logger"
import { importGeographicData } from "../importers/importGeographicData"

export async function seedDatabase() {
  try {
    logger.info("Starting database seeding...")

    // Setup associations
    setupAssociations()

    // Sync database
    await sequelize.sync({ force: true })
    logger.info("Database synchronized")

    // Seed Permissions
    const permissions = await Permission.bulkCreate([
      // User permissions
      { name: "users.create", resource: "users", action: "create", description: "Create users" },
      { name: "users.read", resource: "users", action: "read", description: "Read users" },
      { name: "users.update", resource: "users", action: "update", description: "Update users" },
      { name: "users.delete", resource: "users", action: "delete", description: "Delete users" },
      { name: "users.manage", resource: "users", action: "manage", description: "Full user management" },

      // Region permissions
      { name: "regions.create", resource: "regions", action: "create", description: "Create regions" },
      { name: "regions.read", resource: "regions", action: "read", description: "Read regions" },
      { name: "regions.update", resource: "regions", action: "update", description: "Update regions" },
      { name: "regions.delete", resource: "regions", action: "delete", description: "Delete regions" },

      // Departement permissions
      { name: "departements.create", resource: "departements", action: "create", description: "Create departements" },
      { name: "departements.read", resource: "departements", action: "read", description: "Read departements" },
      { name: "departements.update", resource: "departements", action: "update", description: "Update departements" },
      { name: "departements.delete", resource: "departements", action: "delete", description: "Delete departements" },

      // Arrondissement permissions
      { name: "arrondissements.create", resource: "arrondissements", action: "create", description: "Create arrondissements" },
      { name: "arrondissements.read", resource: "arrondissements", action: "read", description: "Read arrondissements" },
      { name: "arrondissements.update", resource: "arrondissements", action: "update", description: "Update arrondissements" },
      { name: "arrondissements.delete", resource: "arrondissements", action: "delete", description: "Delete arrondissements" },

      // FOSA permissions
      { name: "fosas.create", resource: "fosas", action: "create", description: "Create FOSA" },
      { name: "fosas.read", resource: "fosas", action: "read", description: "Read FOSA" },
      { name: "fosas.update", resource: "fosas", action: "update", description: "Update FOSA" },
      { name: "fosas.delete", resource: "fosas", action: "delete", description: "Delete FOSA" },

      // Batiment permissions
      { name: "batiments.create", resource: "batiments", action: "create", description: "Create batiments" },
      { name: "batiments.read", resource: "batiments", action: "read", description: "Read batiments" },
      { name: "batiments.update", resource: "batiments", action: "update", description: "Update batiments" },
      { name: "batiments.delete", resource: "batiments", action: "delete", description: "Delete batiments" },

      // Service permissions
      { name: "services.create", resource: "services", action: "create", description: "Create services" },
      { name: "services.read", resource: "services", action: "read", description: "Read services" },
      { name: "services.update", resource: "services", action: "update", description: "Update services" },
      { name: "services.delete", resource: "services", action: "delete", description: "Delete services" },

      // Personnel permissions
      { name: "personnels.create", resource: "personnels", action: "create", description: "Create personnels" },
      { name: "personnels.read", resource: "personnels", action: "read", description: "Read personnels" },
      { name: "personnels.update", resource: "personnels", action: "update", description: "Update personnels" },
      { name: "personnels.delete", resource: "personnels", action: "delete", description: "Delete personnels" },

      // Equipement permissions
      { name: "equipements.create", resource: "equipements", action: "create", description: "Create equipements" },
      { name: "equipements.read", resource: "equipements", action: "read", description: "Read equipements" },
      { name: "equipements.update", resource: "equipements", action: "update", description: "Update equipements" },
      { name: "equipements.delete", resource: "equipements", action: "delete", description: "Delete equipements" },

      // Audit permissions
      { name: "audit.read", resource: "audit", action: "read", description: "Read audit logs" },
      { name: "audit.manage", resource: "audit", action: "manage", description: "Manage audit logs" },
    ])
    logger.info(`Created ${permissions.length} permissions`)

    // Seed Roles
    const roles = await Role.bulkCreate([
      { name: "Super Admin", code: "super_admin", description: "Full system access", level: 4 },
      { name: "Admin", code: "admin", description: "Administrative access", level: 3 },
      { name: "Manager", code: "manager", description: "Manager access", level: 2 },
      { name: "User", code: "user", description: "Basic user access", level: 1 },
    ])
    logger.info(`Created ${roles.length} roles`)

    // Seed Role-Permission associations
    const superAdminRole = roles.find(r => r.code === "super_admin")!
    const adminRole = roles.find(r => r.code === "admin")!
    const managerRole = roles.find(r => r.code === "manager")!
    const userRole = roles.find(r => r.code === "user")!

    // Super Admin gets all permissions
    await RolePermission.bulkCreate(
      permissions.map(p => ({ roleId: superAdminRole.id, permissionId: p.id }))
    )

    // Admin permissions (all except user management)
    const adminPermissions = permissions.filter(p =>
      !p.name.startsWith("users.create") &&
      !p.name.startsWith("users.update") &&
      !p.name.startsWith("users.delete") &&
      !p.name.startsWith("users.manage")
    )
    await RolePermission.bulkCreate(
      adminPermissions.map(p => ({ roleId: adminRole.id, permissionId: p.id }))
    )

    // Manager permissions (read geographic data, manage FOSA/batiments/services/personnels/equipements within scope)
    const managerPermissions = permissions.filter(p =>
      p.name.includes(".read") ||
      p.name.startsWith("fosas.update") ||
      p.name.startsWith("batiments.") ||
      p.name.startsWith("services.") ||
      p.name.startsWith("personnels.") ||
      p.name.startsWith("equipements.")
    )
    await RolePermission.bulkCreate(
      managerPermissions.map(p => ({ roleId: managerRole.id, permissionId: p.id }))
    )

    // User permissions (read only)
    const userPermissions = permissions.filter(p => p.name.includes(".read") && !p.name.startsWith("users."))
    await RolePermission.bulkCreate(
      userPermissions.map(p => ({ roleId: userRole.id, permissionId: p.id }))
    )

    logger.info("Role-Permission associations created")

    // Import geographic data from external SQL file
    logger.info("Importing geographic data from external database...")
    await importGeographicData()

    // Get imported data for user seeding
    const regionCentre = await Region.findOne({ where: { nom: "Centre" } })
    const regionLittoral = await Region.findOne({ where: { nom: "Littoral" } })
    const departementMfoundi = await Departement.findOne({ where: { nom: "Mfoundi" } })
    const arrondissementYaounde1 = await Arrondissement.findOne({ where: { nom: "Yaoundé 1er" } })

    // Seed Users with geographic scope (hash passwords manually because bulkCreate doesn't trigger beforeCreate hooks)
    const hashedPassword = await bcrypt.hash("Admin@2024", 10)
    const users = await User.bulkCreate([
      {
        email: "superadmin@health.cm",
        password: hashedPassword,
        firstName: "Super",
        lastName: "Admin",
        role: "super_admin",
        scopeType: "national",
      },
      {
        email: "admin@health.cm",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        scopeType: "national",
      },
      {
        email: "manager.centre@health.cm",
        password: hashedPassword,
        firstName: "Manager",
        lastName: "Centre",
        role: "manager",
        scopeType: "regional",
        regionId: regionCentre?.id,
      },
      {
        email: "manager.mfoundi@health.cm",
        password: hashedPassword,
        firstName: "Manager",
        lastName: "Mfoundi",
        role: "manager",
        scopeType: "departemental",
        departementId: departementMfoundi?.id,
      },
      {
        email: "user.yaoundé1@health.cm",
        password: hashedPassword,
        firstName: "User",
        lastName: "Yaoundé 1",
        role: "user",
        scopeType: "arrondissement",
        arrondissementId: arrondissementYaounde1?.id,
      },
      {
        email: "manager.littoral@health.cm",
        password: hashedPassword,
        firstName: "Manager",
        lastName: "Littoral",
        role: "manager",
        scopeType: "regional",
        regionId: regionLittoral?.id,
      },
    ])
    logger.info(`Created ${users.length} users with geographic scope`)

    // Seed Districts
    const districts = await District.bulkCreate([
      {
        nom: "District Sanitaire de Yaoundé",
        responsable: "Dr. Mbarga",
        population: 2500000,
        superficie: 304,
        sitesDisponibles: 45,
        sitesTotaux: 50,
        regionId: regionCentre?.id || 1,
      },
      {
        nom: "District Sanitaire de Douala",
        responsable: "Dr. Njoya",
        population: 3000000,
        superficie: 210,
        sitesDisponibles: 60,
        sitesTotaux: 65,
        regionId: regionLittoral?.id || 1,
      },
    ])
    logger.info(`Created ${districts.length} districts`)

    // Seed Aires de Santé
    const airesantes = await Airesante.bulkCreate([
      {
        nom: "Aire de Santé Centrale",
        responsable: "Dr. Kamga",
        contact: "+237 699 123 456",
        districtId: districts[0]?.id || 1,
      },
      {
        nom: "Aire de Santé Bepanda",
        responsable: "Dr. Fotso",
        contact: "+237 677 234 567",
        districtId: districts[1]?.id || 2,
      },
    ])
    logger.info(`Created ${airesantes.length} aires de santé`)

    // Seed FOSA
    const arrondissementDouala1 = await Arrondissement.findOne({ where: { nom: "Douala 1er" } })

    const fosas = await Fosa.bulkCreate([
      {
        nom: "Hôpital Central de Yaoundé",
        type: "Hôpital",
        capaciteLits: 500,
        estFerme: false,
        situation: "Opérationnel",
        arrondissementId: arrondissementYaounde1?.id || 1,
        airesanteId: airesantes[0]?.id || 1,
      },
      {
        nom: "Centre de Santé Mvog-Ada",
        type: "Centre de Santé",
        capaciteLits: 50,
        estFerme: false,
        situation: "Opérationnel",
        arrondissementId: arrondissementYaounde1?.id || 1,
        airesanteId: airesantes[0]?.id || 1,
      },
      {
        nom: "Hôpital Général de Douala",
        type: "Hôpital",
        capaciteLits: 600,
        estFerme: false,
        situation: "Opérationnel",
        arrondissementId: arrondissementDouala1?.id || 1,
        airesanteId: airesantes[1]?.id || 2,
      },
    ])
    logger.info(`Created ${fosas.length} FOSA`)

    // Seed Categories
    const categories = await Categorie.bulkCreate([
      { nom: "Médecin", type: "Personnel Médical" },
      { nom: "Infirmier", type: "Personnel Médical" },
      { nom: "Sage-femme", type: "Personnel Médical" },
      { nom: "Technicien de Laboratoire", type: "Personnel Technique" },
      { nom: "Administrateur", type: "Personnel Administratif" },
    ])
    logger.info(`Created ${categories.length} categories`)

    // Seed Personnel
    const personnels = await Personnel.bulkCreate([
      {
        nom: "Mbarga",
        prenom: "Jean",
        matricule: "MED001",
        grade: "Médecin Spécialiste",
        categorieId: categories[0]?.id || 1,
        fosaId: fosas[0]?.id || 1,
      },
      {
        nom: "Fotso",
        prenom: "Marie",
        matricule: "INF001",
        grade: "Infirmière Diplômée d'État",
        categorieId: categories[1]?.id || 2,
        fosaId: fosas[0]?.id || 1,
      },
      {
        nom: "Kamga",
        prenom: "Paul",
        matricule: "MED002",
        grade: "Médecin Généraliste",
        categorieId: categories[0]?.id || 1,
        fosaId: fosas[1]?.id || 2,
      },
    ])
    logger.info(`Created ${personnels.length} personnel`)

    logger.info("Database seeding completed successfully!")
  } catch (error) {
    logger.error("Error seeding database:", error)
    throw error
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info("Seeding finished")
      process.exit(0)
    })
    .catch((error) => {
      logger.error("Seeding failed:", error)
      process.exit(1)
    })
}
