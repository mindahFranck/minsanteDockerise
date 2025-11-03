import sequelize from "../config/database"
import { Region } from "../models/Region"
import { Departement } from "../models/Departement"
import { Arrondissement } from "../models/Arrondissement"
import { District } from "../models/District"
import { Airesante } from "../models/Airesante"
import { Fosa } from "../models/Fosa"
import { logger } from "../config/logger"

async function createFosaData() {
  try {
    logger.info("Creating FOSA data...")

    await sequelize.authenticate()
    await sequelize.sync({ alter: true })

    // Récupérer les régions existantes
    const regionCentre = await Region.findOne({ where: { nom: "Centre" } })
    const regionLittoral = await Region.findOne({ where: { nom: "Littoral" } })

    if (!regionCentre || !regionLittoral) {
      logger.error("Régions Centre ou Littoral non trouvées. Exécutez createGeoData.ts d'abord.")
      process.exit(1)
    }

    // Vérifier si les districts existent déjà
    const districtYaounde = await District.findByPk(1)
    const districtMfou = await District.findByPk(2)
    const districtMbalmayo = await District.findByPk(3)
    const districtDouala = await District.findByPk(4)

    if (!districtYaounde || !districtMfou || !districtMbalmayo || !districtDouala) {
      logger.error("Erreur: Les districts n'existent pas. Exécutez d'abord un script pour créer les districts.")
      process.exit(1)
    }

    logger.info(`Using existing ${await District.count()} districts`)

    // Extraire les IDs (problème de Sequelize field shadowing)
    const districtYaoundeId = districtYaounde.toJSON().id
    const districtMfouId = districtMfou.toJSON().id
    const districtMbalmayoId = districtMbalmayo.toJSON().id
    const districtDoualaId = districtDouala.toJSON().id

    // Récupérer les arrondissements (utiliser les IDs car il y a des problèmes d'encodage avec les noms)
    const arrondYaounde1 = await Arrondissement.findByPk(1) // Yaoundé 1er
    const arrondYaounde2 = await Arrondissement.findByPk(2) // Yaoundé 2e
    const arrondYaounde3 = await Arrondissement.findByPk(3) // Yaoundé 3e

    if (!arrondYaounde1 || !arrondYaounde2 || !arrondYaounde3) {
      logger.error("Arrondissements de Yaoundé non trouvés. Exécutez createGeoData.ts d'abord.")
      process.exit(1)
    }

    const arrondYaounde1Id = arrondYaounde1.toJSON().id
    const arrondYaounde2Id = arrondYaounde2.toJSON().id
    const arrondYaounde3Id = arrondYaounde3.toJSON().id

    // Créer des aires de santé (utiliser raw SQL à cause de problème Sequelize avec bulkCreate)
    await sequelize.query(`
      INSERT INTO airesantes (nom, district_id, created_at, updated_at) VALUES
      ('Aire de Santé Tsinga', ${districtYaoundeId}, NOW(), NOW()),
      ('Aire de Santé Messa', ${districtYaoundeId}, NOW(), NOW()),
      ('Aire de Santé Elig-Essono', ${districtYaoundeId}, NOW(), NOW()),
      ('Aire de Santé Mokolo', ${districtYaoundeId}, NOW(), NOW()),
      ('Aire de Santé Nkomo', ${districtYaoundeId}, NOW(), NOW()),
      ('Aire de Santé Melen', ${districtYaoundeId}, NOW(), NOW()),
      ('Aire de Santé Nlongkak', ${districtYaoundeId}, NOW(), NOW()),
      ('Aire de Santé Etoudi', ${districtYaoundeId}, NOW(), NOW()),
      ('Aire de Santé Mfou Central', ${districtMfouId}, NOW(), NOW()),
      ('Aire de Santé Nkolafamba', ${districtMfouId}, NOW(), NOW()),
      ('Aire de Santé Mbalmayo Centre', ${districtMbalmayoId}, NOW(), NOW()),
      ('Aire de Santé Awaé', ${districtMbalmayoId}, NOW(), NOW()),
      ('Aire de Santé Bonassama', ${districtDoualaId}, NOW(), NOW()),
      ('Aire de Santé Deido', ${districtDoualaId}, NOW(), NOW()),
      ('Aire de Santé Akwa', ${districtDoualaId}, NOW(), NOW())
    `)

    // Récupérer les aires de santé créées
    const airesantes = await Airesante.findAll()

    logger.info(`Created ${airesantes.length} aires de santé`)

    // Extraire les IDs des aires de santé (utiliser toJSON pour éviter field shadowing)
    const airesanteTsinga = airesantes.find(a => a.toJSON().nom === "Aire de Santé Tsinga")
    const airesanteMessa = airesantes.find(a => a.toJSON().nom === "Aire de Santé Messa")
    const airesanteEligEssono = airesantes.find(a => a.toJSON().nom === "Aire de Santé Elig-Essono")
    const airesanteMokolo = airesantes.find(a => a.toJSON().nom === "Aire de Santé Mokolo")
    const airesanteNkomo = airesantes.find(a => a.toJSON().nom === "Aire de Santé Nkomo")
    const airesanteMelen = airesantes.find(a => a.toJSON().nom === "Aire de Santé Melen")
    const airesanteNlongkak = airesantes.find(a => a.toJSON().nom === "Aire de Santé Nlongkak")
    const airesanteEtoudi = airesantes.find(a => a.toJSON().nom === "Aire de Santé Etoudi")
    const airesanteMfou = airesantes.find(a => a.toJSON().nom === "Aire de Santé Mfou Central")
    const airesanteMbalmayo = airesantes.find(a => a.toJSON().nom === "Aire de Santé Mbalmayo Centre")

    if (!airesanteTsinga || !airesanteMessa || !airesanteEligEssono || !airesanteMokolo || !airesanteNkomo || !airesanteMelen || !airesanteNlongkak || !airesanteEtoudi || !airesanteMfou || !airesanteMbalmayo) {
      logger.error("Erreur: Une ou plusieurs aires de santé non trouvées")
      logger.info("Aires de santé disponibles: " + airesantes.map(a => a.toJSON().nom).join(", "))
      process.exit(1)
    }

    const airesanteTsingaId = airesanteTsinga.toJSON().id
    const airesanteMessaId = airesanteMessa.toJSON().id
    const airesanteEligEssonoId = airesanteEligEssono.toJSON().id
    const airesanteMokoloId = airesanteMokolo.toJSON().id
    const airesanteNkomoId = airesanteNkomo.toJSON().id
    const airesanteMelenId = airesanteMelen.toJSON().id
    const airesanteNlongkakId = airesanteNlongkak.toJSON().id
    const airesanteEtoudiId = airesanteEtoudi.toJSON().id
    const airesanteMfouId = airesanteMfou.toJSON().id
    const airesanteMbalmayoId = airesanteMbalmayo.toJSON().id

    // Créer des FOSA (utiliser raw SQL)
    await sequelize.query(`
      INSERT INTO fosas (nom, type, capacite_lits, est_ferme, situation, arrondissement_id, airesante_id, created_at, updated_at) VALUES
      ('Hôpital Central de Yaoundé', 'Hôpital public', 500, false, 'Opérationnel - Service complet', ${arrondYaounde1Id}, ${airesanteTsingaId}, NOW(), NOW()),
      ('Hôpital Général de Yaoundé', 'Hôpital public', 350, false, 'Opérationnel', ${arrondYaounde1Id}, ${airesanteMessaId}, NOW(), NOW()),
      ('Hôpital Gynéco-Obstétrique et Pédiatrique de Yaoundé', 'Hôpital public', 250, false, 'Opérationnel', ${arrondYaounde2Id}, ${airesanteEligEssonoId}, NOW(), NOW()),
      ('Hôpital de District de Biyem-Assi', 'Hôpital public', 150, false, 'Opérationnel', ${arrondYaounde3Id}, ${airesanteMokoloId}, NOW(), NOW()),
      ('Hôpital de District de Nkomo', 'Hôpital public', 120, false, 'En maintenance', ${arrondYaounde2Id}, ${airesanteNkomoId}, NOW(), NOW()),
      ('Centre de Santé Intégré de Tsinga', 'Centre de santé public', 30, false, 'Opérationnel', ${arrondYaounde1Id}, ${airesanteTsingaId}, NOW(), NOW()),
      ('Centre de Santé Intégré de Messa', 'Centre de santé public', 25, false, 'Opérationnel', ${arrondYaounde1Id}, ${airesanteMessaId}, NOW(), NOW()),
      ('Centre de Santé Intégré de Melen', 'Centre de santé public', 20, false, 'Opérationnel', ${arrondYaounde2Id}, ${airesanteMelenId}, NOW(), NOW()),
      ('Centre de Santé Intégré de Nlongkak', 'Centre de santé public', 18, false, 'Opérationnel', ${arrondYaounde1Id}, ${airesanteNlongkakId}, NOW(), NOW()),
      ('Centre de Santé Intégré d\\'Etoudi', 'Centre de santé public', 22, false, 'Opérationnel', ${arrondYaounde1Id}, ${airesanteEtoudiId}, NOW(), NOW()),
      ('Clinique de l\\'Unité', 'Clinique privée', 80, false, 'Opérationnel', ${arrondYaounde1Id}, ${airesanteTsingaId}, NOW(), NOW()),
      ('Polyclinique Dominique Savio', 'Clinique privée', 60, false, 'Opérationnel', ${arrondYaounde2Id}, ${airesanteEligEssonoId}, NOW(), NOW()),
      ('Centre Médical de la Cathédrale', 'Centre médical privé', 40, false, 'Opérationnel', ${arrondYaounde1Id}, ${airesanteTsingaId}, NOW(), NOW()),
      ('Hôpital Ad Lucem', 'Hôpital confessionnel', 100, false, 'Opérationnel', ${arrondYaounde2Id}, ${airesanteMelenId}, NOW(), NOW()),
      ('Centre de Santé Catholique Mvolyé', 'Centre de santé confessionnel', 35, false, 'Opérationnel', ${arrondYaounde1Id}, ${airesanteEtoudiId}, NOW(), NOW()),
      ('Hôpital de District de Mfou', 'Hôpital public', 100, false, 'Opérationnel', ${arrondYaounde3Id}, ${airesanteMfouId}, NOW(), NOW()),
      ('Hôpital de District de Mbalmayo', 'Hôpital public', 120, false, 'Opérationnel', ${arrondYaounde3Id}, ${airesanteMbalmayoId}, NOW(), NOW()),
      ('Centre de Santé de Nkolndongo', 'Centre de santé public', 15, true, 'Fermé pour rénovation', ${arrondYaounde1Id}, ${airesanteTsingaId}, NOW(), NOW()),
      ('Centre Médical de Bastos', 'Centre médical privé', 25, false, 'En construction', ${arrondYaounde1Id}, ${airesanteTsingaId}, NOW(), NOW())
    `)

    const fosas = await Fosa.findAll()
    logger.info(`Created ${fosas.length} FOSA`)
    logger.info("\nFOSA created:")
    fosas.forEach(f => {
      logger.info(`- ${f.nom} (${f.type}, ${f.capaciteLits} lits) - ${f.situation}`)
    })

    await sequelize.close()
    process.exit(0)
  } catch (error) {
    logger.error("Error:", error)
    process.exit(1)
  }
}

createFosaData()
