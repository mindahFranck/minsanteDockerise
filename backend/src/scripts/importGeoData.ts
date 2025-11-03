import sequelize from "../config/database"
import Region from "../models/Region"
import Departement from "../models/Departement"
import Commune from "../models/Commune"
import Arrondissement from "../models/Arrondissement"
import Cameroun from "../models/Cameroun"
import { logger } from "../config/logger"
import fs from "fs"
import path from "path"

async function importGeoData() {
  try {
    logger.info("Démarrage de l'import des données géographiques...")

    // Vérifier si les données existent déjà
    const regionsCount = await Region.count()
    const departementsCount = await Departement.count()
    const communesCount = await Commune.count()
    const arrondissementsCount = await Arrondissement.count()

    if (regionsCount > 0 && departementsCount > 0 && communesCount > 0 && arrondissementsCount > 0) {
      logger.info(`Données géographiques déjà présentes: ${regionsCount} régions, ${departementsCount} départements, ${communesCount} communes, ${arrondissementsCount} arrondissements`)
      return
    }

    logger.info("Import des données géographiques depuis les fichiers SQL...")

    const seedsPath = path.join(__dirname, "../../database/seeds")

    // Import des régions
    const regionsFile = path.join(seedsPath, "01_regions.sql")
    if (fs.existsSync(regionsFile)) {
      const regionsSql = fs.readFileSync(regionsFile, "utf8")
      await sequelize.query(regionsSql)
      logger.info("✓ Régions importées")
    }

    // Import des départements
    const departementsFile = path.join(seedsPath, "02_departements.sql")
    if (fs.existsSync(departementsFile)) {
      const departementsSql = fs.readFileSync(departementsFile, "utf8")
      await sequelize.query(departementsSql)
      logger.info("✓ Départements importés")
    }

    // Import des arrondissements (depuis communes.sql)
    const communesFile = path.join(seedsPath, "03_communes.sql")
    if (fs.existsSync(communesFile)) {
      const communesSql = fs.readFileSync(communesFile, "utf8")

      // Remplacer 'communes' par 'arrondissements' dans tout le fichier SQL
      let arrondissementsSql = communesSql
        .replace(/`communes`/g, '`arrondissements`')
        .replace(/communes`/g, 'arrondissements`')
        .replace(/LOCK TABLES `arrondissements`/g, 'LOCK TABLES `arrondissements`')
        .replace(/INSERT INTO `arrondissements`/g, 'INSERT INTO `arrondissements`')

      // Remplacer le nom de la colonne 'commune' par 'nom' dans les INSERT
      // Format: (id, departement_id, commune, ...) devient (id, departement_id, nom, ...)
      arrondissementsSql = arrondissementsSql.replace(
        /INSERT INTO `arrondissements` VALUES \((\d+),(\d+),'([^']+)'/g,
        'INSERT INTO `arrondissements` (id, departement_id, nom, superficie, fit1, fit2, fit3, fit4, division, createdAt, updatedAt, geom) VALUES ($1,$2,\'$3\''
      )

      await sequelize.query(arrondissementsSql)
      logger.info("✓ Arrondissements importés (depuis communes.sql)")
    }

    // Import du Cameroun
    const camerounFile = path.join(seedsPath, "04_cameroun.sql")
    if (fs.existsSync(camerounFile)) {
      const camerounSql = fs.readFileSync(camerounFile, "utf8")
      await sequelize.query(camerounSql)
      logger.info("✓ Données Cameroun importées")
    }

    // Vérification finale
    const finalRegionsCount = await Region.count()
    const finalDepartementsCount = await Departement.count()
    const finalArrondissementsCount = await Arrondissement.count()

    logger.info(`Import terminé: ${finalRegionsCount} régions, ${finalDepartementsCount} départements, ${finalArrondissementsCount} arrondissements`)
  } catch (error: any) {
    logger.error("Erreur lors de l'import des données géographiques:", error.message)
    throw error
  }
}

// Exécution si appelé directement
if (require.main === module) {
  importGeoData()
    .then(() => {
      logger.info("Import des données géographiques terminé avec succès")
      process.exit(0)
    })
    .catch((error) => {
      logger.error("Échec de l'import des données géographiques:", error)
      process.exit(1)
    })
}

export default importGeoData
