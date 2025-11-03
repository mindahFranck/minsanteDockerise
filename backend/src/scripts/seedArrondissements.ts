import sequelize from "../config/database"
import { Arrondissement } from "../models/Arrondissement"
import { Departement } from "../models/Departement"
import { logger } from "../config/logger"

// Arrondissements typiques pour chaque département du Cameroun
const arrondissementsData: { [key: string]: string[] } = {
  "Nde": ["Bangangté", "Bassamba", "Tonga"],
  "Noun": ["Foumban", "Foumbot", "Kouoptamo", "Koutaba", "Magba", "Massangam"],
  "Bamboutos": ["Mbouda", "Babadjou", "Batcham", "Galim"],
  "Mifi": ["Bafoussam I", "Bafoussam II", "Bafoussam III", "Baleng", "Koupa-Matapit", "Santchou"],
  "Menchum": ["Benakuma", "Furu Awa", "Wum", "Zhe"],
  "Momo": ["Batibo", "Mbengwi", "Njikwa", "Widikum-Boffe"],
  "Mezam": ["Bamenda I", "Bamenda II", "Bamenda III", "Bafut", "Bali", "Santa", "Tubah"],
  "Ngo Ketunjia": ["Babessi", "Balikumbat", "Jakiri", "Kom", "Kumbo East", "Kumbo West", "Mbiame", "Misaje", "Ndu", "Nkum"],
  "Donga-Mantung": ["Ako", "Misaje", "Ndu", "Nkambe"],
  "Boyo": ["Belo", "Fundong", "Njinikom"],
  "Ndian": ["Dikome Balue", "Idabato", "Isangele", "Kombo Abedimo", "Kombo Itindi", "Mundemba", "Toko"],
  "Fako": ["Buea", "Limbe I", "Limbe II", "Limbe III", "Muyuka", "Tiko"],
  "Meme": ["Kumba I", "Kumba II", "Kumba III", "Mbonge", "Konye"],
  "Mefou-et-Akono": ["Ngoumou", "Bikok", "Akono", "Mbankomo"],
  "Mefou-et-Afamba": ["Soa", "Edzendouan", "Esse", "Mfou"],
  "Lekie": ["Monatele", "Obala", "Okola", "Ebebda", "Evodoula", "Batchenga", "Sa'a", "Elig-Mfomo"],
  "Nyong-et-Kelle": ["Eseka", "Makak", "Dibang", "Matomb", "Messondo", "Ngog-Mapubi"],
  "Nyong-et-Mfoumou": ["Akonolinga", "Ayos", "Endom", "Kobdombo", "Mengang"],
  "Nyong-et-So'o": ["Mbalmayo", "Akom II", "Dzeng", "Mengueme", "Ngoumou", "Ngulenbak", "Ngomedzap"],
  "Haute-Sanaga": ["Bibey", "Lembe-Yezoum", "Mbandjock", "Minta", "Nanga Eboko", "Nsem"],
  "Mbam-et-Inoubou": ["Bafia", "Bokito", "Deuk", "Kon-Yambetta", "Kiiki", "Makénéné", "Ndikiniméki", "Nitoukou", "Ombessa"],
  "Mbam-et-Kim": ["Ngambe-Tikar", "Ngoro", "Yoko", "Mbam", "Magba"],
  "Diamare": ["Maroua I", "Maroua II", "Maroua III", "Bogo", "Dargala", "Gazawa", "Maga", "Ndoukoula", "Petté", "Pette-Kaelewon", "Wina"],
  "Mayo-Kani": ["Kaele", "Dargala", "Dziguilao", "Guidiguis", "Kar-Hay", "Maga", "Mindif", "Moulvoudaye", "Touloum"],
  "Mayo-Danay": ["Yagoua", "Datcheka", "Gobo", "Gueme", "Kai-Kai", "Kar-Hay", "Maga", "Tchatibali", "Velingara"],
  "Logone-et-Chari": ["Kousseri", "Blangoua", "Darak", "Fotokol", "Goulfey", "Hile-Alifa", "Logone-Birni", "Makary", "Waza", "Zina"],
  "Mayo-Sava": ["Mora", "Kolofata", "Tokombéré"],
  "Mayo-Tsanaga": ["Mokolo", "Bourha", "Koza", "Mayo-Moskota", "Mogode", "Mozogo", "Soulede-Roua"],
  "Benoue": ["Garoua I", "Garoua II", "Garoua III", "Bascheo", "Bibemi", "Dembo", "Gaschiga", "Gashiga", "Lagdo", "Pitoa", "Touroua"],
  "Faro": ["Poli", "Béka", "Galim", "Mayo Baleo"],
  "Mayo-Rey": ["Tcholliré", "Madingring", "Mayo-Rey", "Rey-Bouba", "Touboro"],
  "Mayo-Louti": ["Guider", "Figuil", "Mayo-Oulo"],
  "Vina": ["Ngaoundéré I", "Ngaoundéré II", "Ngaoundéré III", "Belel", "Martap", "Mbé", "Nganha"],
  "Ocean": ["Kribi I", "Kribi II", "Akom II", "Bipindi", "Campo", "Lolodorf", "Mvangane", "Niete"],
  "Vallee-du-Ntem": ["Ambam", "Biem", "Ma'an", "Mintom", "Ngoazip", "Olamze"],
  "Mvila": ["Ebolowa I", "Ebolowa II", "Biwong-Bané", "Biwong-Bulu", "Efoulan", "Mengong", "Mvangan", "Ngoulemakong"],
  "Dja-et-Lobo": ["Sangmelima", "Djoum", "Meyomessala", "Meyomessi", "Mvengue", "Oveng", "Zoetele"],
  "Kadey": ["Batouri", "Kentzou", "Kette", "Mbang", "Ndelele", "Nguelebok", "Ouli"],
  "Lom-et-Djerem": ["Bertoua I", "Bertoua II", "Bétaré-Oya", "Belabo", "Diang", "Garoua-Boulai", "Ngoura"],
  "Haut-Nyong": ["Abong-Mbang", "Atok", "Dimako", "Doumaintang", "Doume", "Lomie", "Mboma", "Messaména", "Messamena", "Mindourou", "Ngoyla", "Nguelebok", "Somalomo"],
  "Boumba-et-Ngoko": ["Yokadouma", "Gari-Gombo", "Moloundou", "Salapoumbe"],
  "Menoua": ["Dschang", "Fokoue", "Fongo-Tongo", "Nkong-Ni", "Penka-Michel", "Santchou"],
  "Koung-Khi": ["Bangourain", "Manjo", "Poumougne"],
  "Hauts-Plateaux": ["Baham", "Bamendjou", "Bangou"],
  "Manyu": ["Mamfe Central", "Akwaya", "Eyumojock", "Upper Bayang"],
  "Lebialem": ["Alou", "Fontem", "Menji", "Wabane"],
  "Kupe-Manenguba": ["Bangem", "Nguti", "Tombel"],
  "Mungo": ["Mbanga", "Melong", "Nkongsamba I", "Nkongsamba II", "Nkongsamba III", "Loum", "Penja"],
  "Nkam": ["Nkondjock", "Yabassi", "Yingui"],
  "Sanaga-Maritime": ["Edea I", "Edea II", "Dizangue", "Mouanko", "Ndom", "Ngambe", "Pouma"],
  "Wouri": ["Douala I", "Douala II", "Douala III", "Douala IV", "Douala V", "Douala VI", "Manoka"],
  "Mayo-Banyo": ["Banyo", "Alhamdou", "Kontcha", "Madingring", "Mayo-Darle", "Tignere"],
}

async function seedArrondissements() {
  try {
    logger.info("Démarrage du seeding des arrondissements...")

    // Vérifier si les arrondissements existent déjà
    const count = await Arrondissement.count()
    if (count > 0) {
      logger.info(`${count} arrondissements déjà présents dans la base`)
      return
    }

    // Charger tous les départements
    const departements = await Departement.findAll()
    logger.info(`${departements.length} départements trouvés`)

    let totalCreated = 0

    for (const dept of departements) {
      const deptNom = dept.get("departement") as string
      const arrondissements = arrondissementsData[deptNom] || []

      if (arrondissements.length === 0) {
        logger.warn(`Aucun arrondissement défini pour ${deptNom}`)
        continue
      }

      for (const arrondNom of arrondissements) {
        await Arrondissement.create({
          nom: arrondNom,
          departementId: dept.get("id") as number,
          population: Math.floor(Math.random() * 50000) + 10000,
          zone: "urbaine",
        })
        totalCreated++
      }

      logger.info(`✓ ${arrondissements.length} arrondissements créés pour ${deptNom}`)
    }

    logger.info(`✅ Seeding terminé: ${totalCreated} arrondissements créés au total`)
  } catch (error: any) {
    logger.error("Erreur lors du seeding des arrondissements:", error.message)
    throw error
  }
}

// Exécution si appelé directement
if (require.main === module) {
  seedArrondissements()
    .then(() => {
      logger.info("Seeding des arrondissements terminé avec succès")
      process.exit(0)
    })
    .catch((error) => {
      logger.error("Échec du seeding des arrondissements:", error)
      process.exit(1)
    })
}

export default seedArrondissements
