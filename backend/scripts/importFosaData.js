const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function importFosaData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
    connectTimeout: 120000,
  });

  try {
    console.log("🔄 Début de l'import des données FOSA...\n");

    // Récupérer des IDs valides pour les clés étrangères
    const [firstAiresante] = await conn.execute(
      "SELECT id FROM airesantes ORDER BY id LIMIT 1"
    );
    const [firstArrond] = await conn.execute(
      "SELECT id FROM arrondissements ORDER BY id LIMIT 1"
    );

    if (firstAiresante.length === 0 || firstArrond.length === 0) {
      throw new Error(
        "Les tables airesantes ou arrondissements sont vides. Veuillez les remplir d'abord."
      );
    }

    const defaultAiresanteId = firstAiresante[0].id;
    const defaultArrondissementId = firstArrond[0].id;

    console.log(
      `✅ Utilisation de l'ID airesante par défaut: ${defaultAiresanteId}`
    );
    console.log(
      `✅ Utilisation de l'ID arrondissement par défaut: ${defaultArrondissementId}\n`
    );

    // Étape 1: Vider la table fosas
    console.log("🗑️  Suppression des données existantes...");
    await conn.execute("DELETE FROM fosas");
    console.log("✅ Table fosas vidée\n");

    // Étape 2: Lire le fichier SQL
    console.log("📖 Lecture du fichier fosa (1).sql...");
    const sqlFilePath = path.join(__dirname, "fosa (1).sql");

    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Le fichier ${sqlFilePath} n'existe pas`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
    console.log(`✅ Fichier lu (${sqlContent.length} caractères)\n`);

    // Nouvelle approche: Trouver la section INSERT et extraire les valeurs
    console.log("🔍 Recherche des instructions INSERT...");

    // Chercher le début du INSERT
    const insertStart = sqlContent.indexOf("INSERT INTO `fosa`");
    if (insertStart === -1) {
      throw new Error(
        "Instruction INSERT INTO `fosa` non trouvée dans le fichier"
      );
    }

    // Chercher les VALUES
    const valuesStart = sqlContent.indexOf("VALUES", insertStart);
    if (valuesStart === -1) {
      throw new Error("Mot-clé VALUES non trouvé après INSERT INTO");
    }

    // Extraire tout après VALUES jusqu'au point-virgule final
    const afterValues = sqlContent.substring(valuesStart + 6); // +6 pour sauter "VALUES"
    const endOfInsert = afterValues.indexOf(";");

    if (endOfInsert === -1) {
      throw new Error("Point-virgule de fin non trouvé");
    }

    const valuesSection = afterValues.substring(0, endOfInsert).trim();
    console.log(
      `✅ Section VALUES trouvée (${valuesSection.length} caractères)\n`
    );

    // Parser les tuples de valeurs
    console.log("📝 Extraction des enregistrements...");
    const records = parseRecords(valuesSection);
    console.log(`✅ ${records.length} enregistrements trouvés\n`);

    // Étape 3: Insérer les données avec mapping et valeurs par défaut
    console.log("💾 Insertion des données avec valeurs par défaut...\n");

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < records.length; i++) {
      try {
        const parts = records[i];

        // Mapping des colonnes depuis le fichier SQL vers la table fosas
        const [
          id, // 0
          libelle, // 1 - Nom de la FOSA
          fonction, // 2
          statut_rec, // 3  (staut_rec dans le fichier)
          tutelle_re, // 4
          cat_rec, // 5
          telephone, // 6  (téléphon dans le fichier)
          titre_foncier, // 7  (titre_fonc dans le fichier)
          document_f, // 8
          superficie, // 9
          nombre_de, // 10
          cloture, // 11 (clôture dans le fichier)
          longitude, // 12
          latitude, // 13
          geom, // 14
        ] = parts;

        // Préparer les valeurs avec défauts
        const insertData = {
          // Champs requis
          nom: libelle || `FOSA ${id}`,
          arrondissement_id: defaultArrondissementId,
          airesante_id: defaultAiresanteId,

          // Champs du fichier SQL mappés
          type: cat_rec || "Non spécifié",
          capacite_lits: nombre_de || 0,
          est_ferme: 0,
          situation: tutelle_re || "Non spécifiée",
          longitude: parseFloat(longitude) || null,
          latitude: parseFloat(latitude) || null,

          // Questions OUI/NON - conversion depuis le fichier
          a_cloture: convertToBoolean(cloture),
          connectee_electricite: 0,
          type_courant: null,
          a_titre_foncier: convertToBoolean(titre_foncier),

          // Autres champs
          fonction: convertToBoolean(fonction),
          statut_rec: statut_rec || "Non spécifié",
          cat_rec: cat_rec || "Non spécifié",
          nom_direct: "Non spécifié",
          org_unit: null,
          image: null,

          // Timestamps
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Créer la géométrie POINT à partir des coordonnées
        let geomValue = "ST_GeomFromText('POINT(0 0)', 4326)";
        if (insertData.longitude && insertData.latitude) {
          geomValue = `ST_GeomFromText('POINT(${insertData.longitude} ${insertData.latitude})', 4326)`;
        }

        // Insérer dans la base de données
        await conn.execute(
          `INSERT INTO fosas (
            nom, type, capacite_lits, est_ferme, situation, image,
            arrondissement_id, airesante_id, longitude, latitude, geom,
            a_cloture, connectee_electricite, type_courant, a_titre_foncier,
            org_unit, fonction, statut_rec, cat_rec, nom_direct,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${geomValue}, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            insertData.nom,
            insertData.type,
            insertData.capacite_lits,
            insertData.est_ferme,
            insertData.situation,
            insertData.image,
            insertData.arrondissement_id,
            insertData.airesante_id,
            insertData.longitude,
            insertData.latitude,
            insertData.a_cloture,
            insertData.connectee_electricite,
            insertData.type_courant,
            insertData.a_titre_foncier,
            insertData.org_unit,
            insertData.fonction,
            insertData.statut_rec,
            insertData.cat_rec,
            insertData.nom_direct,
            insertData.created_at,
            insertData.updated_at,
          ]
        );

        successCount++;
        if ((i + 1) % 100 === 0) {
          console.log(`✅ ${i + 1} enregistrements insérés...`);
        }
      } catch (err) {
        errorCount++;
        console.error(`❌ Erreur sur l'enregistrement ${i + 1}:`, err.message);
      }
    }

    console.log("\n✨ Import terminé!");
    console.log(`✅ Succès: ${successCount} enregistrements`);
    console.log(`❌ Erreurs: ${errorCount} enregistrements\n`);

    // Vérifier les données
    const [count] = await conn.execute("SELECT COUNT(*) as total FROM fosas");
    console.log(`📊 Total d'enregistrements dans la table: ${count[0].total}`);
  } catch (err) {
    console.error("❌ Erreur:", err);
  } finally {
    await conn.end();
  }
}

// Fonction pour parser tous les enregistrements de la section VALUES
function parseRecords(valuesSection) {
  const records = [];
  let depth = 0;
  let currentRecord = "";
  let inQuotes = false;
  let escapeNext = false;

  for (let i = 0; i < valuesSection.length; i++) {
    const char = valuesSection[i];

    if (escapeNext) {
      currentRecord += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      currentRecord += char;
      escapeNext = true;
      continue;
    }

    if (char === "'" && !escapeNext) {
      inQuotes = !inQuotes;
      currentRecord += char;
      continue;
    }

    if (!inQuotes) {
      if (char === "(") {
        depth++;
        if (depth === 1) {
          currentRecord = "";
          continue;
        }
      } else if (char === ")") {
        depth--;
        if (depth === 0) {
          // Fin d'un enregistrement
          records.push(parseValues(currentRecord));
          currentRecord = "";
          continue;
        }
      }
    }

    if (depth > 0) {
      currentRecord += char;
    }
  }

  return records;
}

// Fonction pour parser les valeurs d'un enregistrement
function parseValues(valueString) {
  const parts = [];
  let current = "";
  let inQuotes = false;
  let escapeNext = false;

  for (let i = 0; i < valueString.length; i++) {
    const char = valueString[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    // Gérer les valeurs hexadécimales (0x...)
    if (
      !inQuotes &&
      current === "" &&
      char === "0" &&
      i + 1 < valueString.length &&
      valueString[i + 1] === "x"
    ) {
      let hexEnd = i + 2;
      while (
        hexEnd < valueString.length &&
        /[0-9a-fA-F]/.test(valueString[hexEnd])
      ) {
        hexEnd++;
      }
      current = valueString.substring(i, hexEnd);
      i = hexEnd - 1;
      continue;
    }

    if (char === "'" && !escapeNext) {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      const trimmed = current.trim();
      parts.push(trimmed === "NULL" || trimmed === "" ? null : trimmed);
      current = "";
      continue;
    }

    current += char;
  }

  // Ajouter la dernière valeur
  if (current || current === "") {
    const trimmed = current.trim();
    parts.push(trimmed === "NULL" || trimmed === "" ? null : trimmed);
  }

  return parts;
}

// Fonction pour convertir les valeurs texte en booléen
function convertToBoolean(value) {
  if (!value || value === "NULL" || value === null) {
    return 0;
  }

  const val = value.toString().toLowerCase().trim();

  if (val === "oui" || val === "yes" || val === "1" || val === "true") {
    return 1;
  }

  return 0;
}

importFosaData();
