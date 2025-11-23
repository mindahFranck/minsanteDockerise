# Guide d'utilisation - Import Excel

Ce guide explique comment utiliser le système d'import Excel pour importer des données en masse dans l'application.

## Tables Importables

Les tables suivantes peuvent être importées via Excel :
- ✅ `batiments` - Bâtiments
- ✅ `categories` - Catégories
- ✅ `degradations` - Dégradations
- ✅ `equipebios` - Équipements biomédicaux
- ✅ `equipements` - Équipements
- ✅ `fosas` - Formations sanitaires (FOSA)
- ✅ `materielroulants` - Matériel roulant
- ✅ `parametres` - Paramètres
- ✅ `personnels` - Personnel
- ✅ `services` - Services
- ✅ `users` - Utilisateurs

**Tables exclues** (gérées différemment) :
- ❌ `regions`
- ❌ `departements`
- ❌ `arrondissements`
- ❌ `districts`
- ❌ `airesantes`

## API Endpoints

### 1. Obtenir la liste des tables importables

```http
GET /api/v1/import/tables
Authorization: Bearer {token}
```

**Réponse :**
```json
{
  "success": true,
  "data": ["batiments", "categories", "degradations", ...]
}
```

### 2. Obtenir la structure d'une table

```http
GET /api/v1/import/{table}/structure
Authorization: Bearer {token}
```

**Exemple :**
```http
GET /api/v1/import/batiments/structure
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "table": "batiments",
    "columns": [
      {
        "name": "id",
        "type": "int",
        "nullable": false,
        "key": "PRI",
        "auto_increment": true
      },
      {
        "name": "nom",
        "type": "varchar",
        "nullable": false,
        "key": "",
        "auto_increment": false
      }
    ],
    "foreignKeys": {
      "fosa_id": {
        "referenced_table": "fosas",
        "referenced_column": "id",
        "options": [
          { "id": 1, "nom": "FOSA 1" },
          { "id": 2, "nom": "FOSA 2" }
        ]
      }
    },
    "requiredColumns": ["nom", "type", "fosa_id"]
  }
}
```

### 3. Télécharger un fichier modèle Excel

```http
GET /api/v1/import/{table}/template
Authorization: Bearer {token}
```

**Exemple :**
```http
GET /api/v1/import/batiments/template
```

**Réponse :** Fichier Excel téléchargé avec :
- Une ligne d'en-têtes avec les noms de colonnes
- Des annotations pour les clés étrangères (FK -> table)
- Des types de données [varchar], [int], etc.
- Une ligne d'exemple avec des données types

### 4. Importer des données depuis Excel

```http
POST /api/v1/import/{table}
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Corps de la requête :**
- `file` : Fichier Excel (.xlsx ou .xls)
- `foreignKeyMappings` : (Optionnel) JSON avec les valeurs des clés étrangères

**Exemple avec curl :**
```bash
curl -X POST \
  http://localhost:3000/api/v1/import/batiments \
  -H "Authorization: Bearer {token}" \
  -F "file=@batiments.xlsx" \
  -F 'foreignKeyMappings={"fosa_id": 1, "degradation_id": 2}'
```

**Réponse :**
```json
{
  "success": true,
  "message": "Import terminé",
  "data": {
    "total": 100,
    "success": 98,
    "errors": 2,
    "errorDetails": [
      {
        "row": 5,
        "error": "Duplicate entry 'BAT001' for key 'PRIMARY'"
      },
      {
        "row": 12,
        "error": "Cannot add or update a child row: a foreign key constraint fails"
      }
    ]
  }
}
```

## Workflow d'import

### Étape 1 : Télécharger le modèle

1. Authentifiez-vous et obtenez un token
2. Téléchargez le fichier modèle pour la table souhaitée
3. Le fichier contient les en-têtes et un exemple

### Étape 2 : Remplir le fichier Excel

1. Ouvrez le fichier téléchargé
2. Supprimez la ligne d'exemple
3. Remplissez vos données :
   - Respectez les types de données indiqués
   - Ne modifiez pas les en-têtes
   - Pour les colonnes avec FK, utilisez des IDs valides ou utilisez `foreignKeyMappings`

### Étape 3 : Gérer les clés étrangères

**Option 1 : Mettre les IDs directement dans Excel**
```
nom          | type      | fosa_id (FK -> fosas)
Bâtiment A   | Principal | 1
Bâtiment B   | Annexe    | 1
```

**Option 2 : Utiliser foreignKeyMappings**

Si tous les enregistrements ont la même FK :
```json
{
  "fosa_id": 1,
  "degradation_id": 2
}
```

### Étape 4 : Importer le fichier

1. Utilisez l'endpoint POST avec votre fichier
2. Ajoutez `foreignKeyMappings` si nécessaire
3. Vérifiez la réponse pour les erreurs

## Exemples par table

### Import de Bâtiments

```http
GET /api/v1/import/batiments/template
```

Fichier Excel généré :
```
nom [varchar] | type [varchar] | etat [varchar] | fosa_id (FK -> fosas) [int] | degradation_id (FK -> degradations) [int]
```

### Import de Personnel

```http
GET /api/v1/import/personnels/template
```

Fichier Excel généré :
```
nom [varchar] | prenom [varchar] | matricule [varchar] | grade [varchar] | fosa_id (FK -> fosas) [int] | categorie_id (FK -> categories) [int]
```

### Import d'Équipements

```http
GET /api/v1/import/equipements/template
```

Fichier Excel généré :
```
nom [varchar] | type [varchar] | date_acquisition [datetime] | service_id (FK -> services) [int]
```

## Bonnes pratiques

### ✅ À faire

1. **Toujours télécharger le modèle** pour avoir les bonnes colonnes
2. **Vérifier les IDs** des clés étrangères avant l'import
3. **Tester avec quelques lignes** avant un import massif
4. **Vérifier les erreurs** dans la réponse
5. **Utiliser foreignKeyMappings** pour les imports par lot avec les mêmes FKs

### ❌ À éviter

1. Ne pas modifier les en-têtes du fichier modèle
2. Ne pas laisser de valeurs NULL pour les colonnes requises
3. Ne pas importer des IDs pour la colonne auto_increment (id)
4. Ne pas oublier les timestamps (gérés automatiquement)

## Gestion des erreurs

### Erreurs courantes

**Erreur : "Cette table ne peut pas être importée"**
- Cause : Table dans la liste des exclusions
- Solution : Utiliser l'API spécifique pour ces tables

**Erreur : "Le fichier Excel est vide"**
- Cause : Aucune donnée dans le fichier (seulement les en-têtes)
- Solution : Ajouter au moins une ligne de données

**Erreur : "Foreign key constraint fails"**
- Cause : ID de clé étrangère invalide
- Solution : Vérifier que les IDs existent dans les tables référencées

**Erreur : "Duplicate entry"**
- Cause : Violation de contrainte d'unicité
- Solution : Vérifier les doublons dans vos données

## Formats de données

### Dates
- Format : `YYYY-MM-DD` (ex: `2025-11-23`)

### DateTime
- Format : `YYYY-MM-DD HH:mm:ss` (ex: `2025-11-23 14:30:00`)

### Booléens (tinyint)
- 0 = Non/Faux
- 1 = Oui/Vrai

### Nombres décimaux
- Utiliser le point comme séparateur décimal (ex: `12.34`)

## Limites

- **Taille de fichier** : Maximum 10MB
- **Format** : Uniquement .xlsx et .xls
- **Encodage** : UTF-8 recommandé

## Support

Pour toute question ou problème :
1. Vérifier ce guide
2. Consulter la documentation Swagger à `/api-docs`
3. Contacter l'équipe technique
