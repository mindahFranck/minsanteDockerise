import sequelize from "../config/database"
import { Region } from "../models/Region"
import { Departement } from "../models/Departement"
import { Arrondissement } from "../models/Arrondissement"
import { logger } from "../config/logger"

async function createGeoData() {
  try {
    logger.info("Creating geographic data...")

    await sequelize.authenticate()
    await sequelize.sync({ alter: true })

    // Créer les régions du Cameroun
    const regions = await Region.bulkCreate([
      { nom: "Adamaoua", population: 1200000, latitude: 7.3667, longitude: 13.5833 },
      { nom: "Centre", population: 4000000, latitude: 4.0511, longitude: 11.5021 },
      { nom: "Est", population: 900000, latitude: 4.5000, longitude: 14.0000 },
      { nom: "Extrême-Nord", population: 4500000, latitude: 10.5900, longitude: 14.2000 },
      { nom: "Littoral", population: 3500000, latitude: 4.0483, longitude: 9.7043 },
      { nom: "Nord", population: 2500000, latitude: 9.3167, longitude: 13.3833 },
      { nom: "Nord-Ouest", population: 2100000, latitude: 6.0000, longitude: 10.1500 },
      { nom: "Ouest", population: 2000000, latitude: 5.4833, longitude: 10.4167 },
      { nom: "Sud", population: 800000, latitude: 2.9167, longitude: 11.5167 },
      { nom: "Sud-Ouest", population: 1500000, latitude: 4.1667, longitude: 9.2333 },
    ])

    logger.info(`Created ${regions.length} regions`)

    // Créer des départements pour les régions principales
    const regionCentre = regions.find(r => r.nom === "Centre")
    const regionLittoral = regions.find(r => r.nom === "Littoral")
    const regionOuest = regions.find(r => r.nom === "Ouest")

    const departements = await Departement.bulkCreate([
      // Région Centre
      { nom: "Mfoundi", chefLieu: "Yaoundé", population: 2500000, latitude: 3.8667, longitude: 11.5167, regionId: regionCentre!.id },
      { nom: "Lekié", chefLieu: "Monatélé", population: 350000, latitude: 4.7167, longitude: 11.3833, regionId: regionCentre!.id },
      { nom: "Mbam-et-Inoubou", chefLieu: "Bafia", population: 180000, latitude: 4.7500, longitude: 11.2333, regionId: regionCentre!.id },
      { nom: "Mefou-et-Afamba", chefLieu: "Mfou", population: 130000, latitude: 3.7167, longitude: 11.6833, regionId: regionCentre!.id },
      { nom: "Mefou-et-Akono", chefLieu: "Ngoumou", population: 65000, latitude: 3.6833, longitude: 11.4667, regionId: regionCentre!.id },
      { nom: "Nyong-et-Kelle", chefLieu: "Eseka", population: 120000, latitude: 3.6500, longitude: 10.7667, regionId: regionCentre!.id },
      { nom: "Nyong-et-Mfoumou", chefLieu: "Akonolinga", population: 130000, latitude: 3.7667, longitude: 12.2500, regionId: regionCentre!.id },
      { nom: "Nyong-et-So'o", chefLieu: "Mbalmayo", population: 180000, latitude: 3.5167, longitude: 11.5000, regionId: regionCentre!.id },
      { nom: "Haute-Sanaga", chefLieu: "Nanga-Eboko", population: 115000, latitude: 4.6833, longitude: 12.3833, regionId: regionCentre!.id },
      { nom: "Mbam-et-Kim", chefLieu: "Ntui", population: 65000, latitude: 4.5167, longitude: 11.6500, regionId: regionCentre!.id },

      // Région Littoral
      { nom: "Wouri", chefLieu: "Douala", population: 3000000, latitude: 4.0483, longitude: 9.7043, regionId: regionLittoral!.id },
      { nom: "Moungo", chefLieu: "Nkongsamba", population: 350000, latitude: 4.9547, longitude: 9.9403, regionId: regionLittoral!.id },
      { nom: "Nkam", chefLieu: "Yabassi", population: 120000, latitude: 4.4500, longitude: 9.9667, regionId: regionLittoral!.id },
      { nom: "Sanaga-Maritime", chefLieu: "Edéa", population: 150000, latitude: 3.8000, longitude: 10.1333, regionId: regionLittoral!.id },

      // Région Ouest
      { nom: "Bamboutos", chefLieu: "Mbouda", population: 320000, latitude: 5.6333, longitude: 10.2500, regionId: regionOuest!.id },
      { nom: "Hauts-Plateaux", chefLieu: "Baham", population: 120000, latitude: 5.3167, longitude: 10.3833, regionId: regionOuest!.id },
      { nom: "Koung-Khi", chefLieu: "Bandjoun", population: 80000, latitude: 5.3500, longitude: 10.4167, regionId: regionOuest!.id },
      { nom: "Menoua", chefLieu: "Dschang", population: 370000, latitude: 5.4500, longitude: 10.0667, regionId: regionOuest!.id },
      { nom: "Mifi", chefLieu: "Bafoussam", population: 450000, latitude: 5.4833, longitude: 10.4167, regionId: regionOuest!.id },
      { nom: "Ndé", chefLieu: "Bangangté", population: 160000, latitude: 5.1500, longitude: 10.5167, regionId: regionOuest!.id },
      { nom: "Noun", chefLieu: "Foumban", population: 380000, latitude: 5.7333, longitude: 10.9000, regionId: regionOuest!.id },
      { nom: "Haut-Nkam", chefLieu: "Bafang", population: 260000, latitude: 5.1667, longitude: 10.1667, regionId: regionOuest!.id },
    ])

    logger.info(`Created ${departements.length} departements`)

    // Créer des arrondissements pour Yaoundé et Douala
    const mfoundi = departements.find(d => (d as any).nom === "Mfoundi")
    const wouri = departements.find(d => (d as any).nom === "Wouri")

    const arrondissements = await Arrondissement.bulkCreate([
      // Arrondissements de Yaoundé
      { nom: "Yaoundé 1er", population: 300000, latitude: 3.8667, longitude: 11.5167, departementId: mfoundi!.id },
      { nom: "Yaoundé 2e", population: 350000, latitude: 3.8500, longitude: 11.4833, departementId: mfoundi!.id },
      { nom: "Yaoundé 3e", population: 400000, latitude: 3.8500, longitude: 11.5000, departementId: mfoundi!.id },
      { nom: "Yaoundé 4e", population: 350000, latitude: 3.8833, longitude: 11.5333, departementId: mfoundi!.id },
      { nom: "Yaoundé 5e", population: 300000, latitude: 3.8333, longitude: 11.5167, departementId: mfoundi!.id },
      { nom: "Yaoundé 6e", population: 400000, latitude: 3.8833, longitude: 11.5000, departementId: mfoundi!.id },
      { nom: "Yaoundé 7e", population: 400000, latitude: 3.8167, longitude: 11.5500, departementId: mfoundi!.id },

      // Arrondissements de Douala
      { nom: "Douala 1er", population: 500000, latitude: 4.0483, longitude: 9.7043, departementId: wouri!.id },
      { nom: "Douala 2e", population: 400000, latitude: 4.0333, longitude: 9.7167, departementId: wouri!.id },
      { nom: "Douala 3e", population: 500000, latitude: 4.0667, longitude: 9.7333, departementId: wouri!.id },
      { nom: "Douala 4e", population: 600000, latitude: 4.0833, longitude: 9.7500, departementId: wouri!.id },
      { nom: "Douala 5e", population: 500000, latitude: 4.0167, longitude: 9.7500, departementId: wouri!.id },
    ])

    logger.info(`Created ${arrondissements.length} arrondissements`)

    logger.info("\n=== Geographic Data Summary ===")
    logger.info(`Regions: ${regions.length}`)
    logger.info(`Departements: ${departements.length}`)
    logger.info(`Arrondissements: ${arrondissements.length}`)

    await sequelize.close()
    process.exit(0)
  } catch (error) {
    logger.error("Error:", error)
    process.exit(1)
  }
}

createGeoData()
