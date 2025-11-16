import sequelize from "../src/config/database";
import Fosa from "../src/models/Fosa";
import Arrondissement from "../src/models/Arrondissement";
import * as fs from "fs";
import * as path from "path";

interface FormationSanitaireData {
  idfs: number;
  geom: string;
  region: string;
  district: string;
  airesa: string;
  nomfs: string;
  latitud: number;
  longitud: number;
  altitud: number;
  typefs: string;
  statutfs: string;
  idvil: number | null;
  dateouverture: string | null;
  codefs: string | null;
  popfs: number | null;
  fonctionfs: string | null;
  situationfs: string | null;
  id_as: number;
}

async function importFormationSanitaire() {
  try {
    console.log("🔄 Démarrage de l'importation des formations sanitaires...");

    // Lire le fichier JSON
    const jsonPath = path.join(__dirname, "formationSanitaire.json");
    const jsonData = fs.readFileSync(jsonPath, "utf-8");
    const formationSanitaires: FormationSanitaireData[] = JSON.parse(jsonData);

    console.log(`📊 ${formationSanitaires.length} formations sanitaires à importer`);

    // Récupérer un arrondissement par défaut
    const arrondissements = await Arrondissement.findAll({
      attributes: ["id", "nom"],
      limit: 1,
    });

    const defaultArrondissementId = arrondissements[0]?.id;

    if (!defaultArrondissementId) {
      console.error("❌ Aucun arrondissement disponible dans la base de données");
      console.error("   Veuillez d'abord ajouter au moins un arrondissement");
      return;
    }

    console.log(`🏘️  Arrondissement par défaut: ID ${defaultArrondissementId}`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails: { nom: string; error: string }[] = [];

    for (const fs_data of formationSanitaires) {
      try {
        // Vérifier que id_as est présent
        if (!fs_data.id_as) {
          console.warn(`⚠️  id_as manquant pour ${fs_data.nomfs}`);
          skipped++;
          continue;
        }

        // Vérifier si le FOSA existe déjà (basé sur le nom et l'aire de santé)
        const existing = await Fosa.findOne({
          where: {
            nom: fs_data.nomfs,
            airesanteId: fs_data.id_as,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Créer le nouveau FOSA avec transformation des données
        await Fosa.create({
          nom: fs_data.nomfs,                    // nomfs -> nom
          type: fs_data.typefs,                  // typefs -> type
          situation: fs_data.situationfs || fs_data.statutfs,  // situationfs ou statutfs -> situation
          airesanteId: fs_data.id_as,            // id_as -> airesanteId
          arrondissementId: defaultArrondissementId,  // arrondissement par défaut
          latitude: fs_data.latitud,             // latitud -> latitude
          longitude: fs_data.longitud,           // longitud -> longitude
          estFerme: false,
        });

        imported++;

        if (imported % 10 === 0) {
          console.log(`✅ ${imported} formations sanitaires importées...`);
        }
      } catch (error: any) {
        console.error(`❌ Erreur lors de l'import de ${fs_data.nomfs}:`, error.message);
        errorDetails.push({
          nom: fs_data.nomfs,
          error: error.message,
        });
        errors++;
      }
    }

    console.log("\n📈 Résumé de l'importation:");
    console.log(`   ✅ Importés: ${imported}`);
    console.log(`   ⏭️  Ignorés (déjà existants): ${skipped}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`   📊 Total: ${formationSanitaires.length}`);

    if (errorDetails.length > 0 && errorDetails.length <= 10) {
      console.log(`\n❌ Détails des erreurs:`);
      errorDetails.forEach(({ nom, error }) => {
        console.log(`   - ${nom}: ${error}`);
      });
    }
  } catch (error) {
    console.error("❌ Erreur fatale:", error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Exécuter l'importation
importFormationSanitaire()
  .then(() => {
    console.log("\n✨ Importation terminée avec succès!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erreur lors de l'importation:", error);
    process.exit(1);
  });
