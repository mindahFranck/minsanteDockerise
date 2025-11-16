# Import des Formations Sanitaires (FOSA)

Ce script permet d'importer les données des formations sanitaires depuis le fichier `formationSanitaire.json` vers la table `fosas` de la base de données.

## Structure des données

### Fichier source : `formationSanitaire.json`

Le fichier contient 171 formations sanitaires avec les champs suivants :

```json
{
  "idfs": 160,
  "geom": "0101000020E6100000F085C954C1102740DFA5D425E3F80E40",
  "region": "Centre",
  "district": "Djoungolo",
  "airesa": "Essos",
  "nomfs": "Centre CNPS",
  "latitud": 3.871527,
  "longitud": 11.532725,
  "altitud": 731.4,
  "typefs": "HC",
  "statutfs": "Public",
  "idvil": null,
  "dateouverture": null,
  "codefs": null,
  "popfs": null,
  "fonctionfs": null,
  "situationfs": null,
  "id_as": 1230
}
```

### Mapping vers la table `fosas`

| Champ JSON | Champ Table | Description |
|------------|-------------|-------------|
| `nomfs` | `nom` | Nom de la formation sanitaire |
| `typefs` | `type` | Type (HC, HR, HD, etc.) |
| `statutfs` ou `situationfs` | `situation` | Statut (Public, Privé, etc.) |
| `id_as` | `airesanteId` | **ID de l'aire de santé (clé étrangère)** |
| `latitud` | `latitude` | Latitude |
| `longitud` | `longitude` | Longitude |
| - | `arrondissementId` | Arrondissement par défaut (1er disponible) |
| - | `estFerme` | `false` par défaut |

## Prérequis

1. **Base de données accessible** : Le serveur MySQL doit être accessible
2. **Arrondissements existants** : Au moins un arrondissement doit exister dans la table `arrondissements`
3. **Aires de santé** : Les `id_as` du fichier JSON doivent correspondre aux IDs de la table `airesantes`

## Utilisation

### Commande simple

```bash
cd backend
npm run db:import:fosas
```

### Vérification après import

```bash
# Se connecter à la base de données et vérifier
mysql -h srv915.hstgr.io -u u877916646_minsante -p u877916646_minstante

# Compter les FOSAs importés
SELECT COUNT(*) as total FROM fosas;

# Voir quelques exemples
SELECT id, nom, type, latitude, longitude, airesanteId
FROM fosas
LIMIT 10;
```

## Comportement du script

1. **Lecture** : Charge les 171 formations sanitaires du fichier JSON
2. **Arrondissement par défaut** : Récupère le premier arrondissement disponible
3. **Validation** : Vérifie que `id_as` est présent pour chaque FOSA
4. **Déduplication** : Ignore les FOSAs déjà existants (basé sur `nom` + `airesanteId`)
5. **Import** : Insère les nouveaux FOSAs dans la base de données
6. **Rapport** : Affiche un résumé avec le nombre d'importés, ignorés et erreurs

## Résolution des problèmes

### Erreur de connexion (ETIMEDOUT)

Si vous obtenez une erreur `ETIMEDOUT` :
- Vérifiez que vous êtes connecté à Internet
- Vérifiez les paramètres de connexion dans `.env`
- Vérifiez que le serveur distant accepte les connexions

### Aucun arrondissement disponible

Si le message "Aucun arrondissement disponible" apparaît :
```bash
# Ajoutez au moins un arrondissement dans la BD
npm run db:seed  # ou créez-en un manuellement
```

### Clé étrangère invalide (airesanteId)

Si certains `id_as` n'existent pas dans la table `airesantes` :
- Ces FOSAs seront ignorés
- Le script affichera le nombre d'erreurs à la fin
- Vérifiez les détails dans les logs d'erreur

## Exemple de sortie

```
🔄 Démarrage de l'importation des formations sanitaires...
📊 171 formations sanitaires à importer
🏘️  Arrondissement par défaut: ID 1
✅ 10 formations sanitaires importées...
✅ 20 formations sanitaires importées...
...
✅ 170 formations sanitaires importées...

📈 Résumé de l'importation:
   ✅ Importés: 165
   ⏭️  Ignorés (déjà existants): 3
   ❌ Erreurs: 3
   📊 Total: 171

✨ Importation terminée avec succès!
```

## Notes importantes

- Le script utilise l'**arrondissement par défaut** pour tous les FOSAs car le fichier JSON ne contient pas d'informations sur les arrondissements
- Les FOSAs sont créés avec `estFerme = false` par défaut
- Le script gère automatiquement les doublons basés sur le nom et l'aire de santé
- Les coordonnées géométriques (`geom`) ne sont pas importées, seules les coordonnées latitude/longitude le sont
