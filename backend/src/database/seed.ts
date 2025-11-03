import { setupAssociations } from "../models"
import { User } from "../models/User"
import { Region } from "../models/Region"
import { Departement } from "../models/Departement"
import { Degradation } from "../models/Degradation"
import { Categorie } from "../models/Categorie"

async function seed() {
  try {
    console.log("[v0] Starting database seeding...")

    setupAssociations()

    // Create users
    await User.bulkCreate([
      {
        email: "superadmin@health.cm",
        password: "Admin@123",
        firstName: "Super",
        lastName: "Admin",
        role: "super_admin",
        isActive: true,
      },
      {
        email: "admin@health.cm",
        password: "Admin@123",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isActive: true,
      },
      {
        email: "manager@health.cm",
        password: "Manager@123",
        firstName: "Manager",
        lastName: "User",
        role: "manager",
        isActive: true,
      },
      {
        email: "user@health.cm",
        password: "User@123",
        firstName: "Regular",
        lastName: "User",
        role: "user",
        isActive: true,
      },
    ])

    // Create regions
    const regions = await Region.bulkCreate([
      { nom: "Centre", population: 3500000 },
      { nom: "Littoral", population: 3200000 },
      { nom: "Ouest", population: 2100000 },
      { nom: "Nord", population: 2400000 },
      { nom: "Extrême-Nord", population: 4000000 },
      { nom: "Adamaoua", population: 1200000 },
      { nom: "Est", population: 900000 },
      { nom: "Sud", population: 800000 },
      { nom: "Nord-Ouest", population: 2000000 },
      { nom: "Sud-Ouest", population: 1500000 },
    ])

    // Create sample departments
    await Departement.bulkCreate([
      { nom: "Mfoundi", population: 2500000, chefLieu: "Yaoundé", regionId: regions[0].id },
      { nom: "Wouri", population: 2800000, chefLieu: "Douala", regionId: regions[1].id },
      { nom: "Menoua", population: 400000, chefLieu: "Dschang", regionId: regions[2].id },
    ])

    // Create degradation types
    await Degradation.bulkCreate([
      { type: "Fissures murales" },
      { type: "Toiture endommagée" },
      { type: "Problèmes électriques" },
      { type: "Plomberie défectueuse" },
      { type: "Peinture écaillée" },
    ])

    // Create categories
    await Categorie.bulkCreate([
      { nom: "Médecin", type: "Personnel médical" },
      { nom: "Infirmier", type: "Personnel médical" },
      { nom: "Sage-femme", type: "Personnel médical" },
      { nom: "Technicien de laboratoire", type: "Personnel technique" },
      { nom: "Pharmacien", type: "Personnel médical" },
      { nom: "Administrateur", type: "Personnel administratif" },
    ])

    console.log("[v0] Database seeding completed successfully!")
    process.exit(0)
  } catch (error) {
    console.error("[v0] Seeding failed:", error)
    process.exit(1)
  }
}

seed()
