# Guide d'Utilisation - Import Excel (Pour Administrateurs)

Ce guide explique comment utiliser la fonctionnalité d'import Excel pour importer des données en masse dans l'application de gestion sanitaire.

## Accès à la fonctionnalité

### Prérequis
- Vous devez être **connecté en tant qu'administrateur**
- Accédez à l'application via le navigateur web

### Navigation
1. Connectez-vous à l'application
2. Dans le menu latéral, cliquez sur **"Administration"**
3. Cliquez sur **"Import Excel"**

## Processus d'Import en 4 Étapes

### Étape 1 : Sélectionner une Table

Sur la page d'import, vous verrez une grille avec toutes les tables disponibles pour l'import :

**Tables disponibles :**
- **Bâtiments** - Infrastructures des FOSA
- **Catégories** - Catégories de personnel
- **Dégradations** - Types de dégradations
- **Équipements biomédicaux** - Matériel médical
- **Équipements** - Équipements généraux
- **Formations sanitaires (FOSA)** - Centres de santé
- **Matériel roulant** - Véhicules et ambulances
- **Paramètres** - Paramètres opérationnels
- **Personnel** - Employés et agents de santé
- **Services** - Services médicaux
- **Utilisateurs** - Utilisateurs de l'application

**Tables NON disponibles pour l'import Excel :**
- Régions (données de référence)
- Départements (données de référence)
- Arrondissements (données de référence)
- Districts (données de référence)
- Aires de santé (données de référence)

Cliquez sur la table que vous souhaitez importer.

### Étape 2 : Configurer les Clés Étrangères

Si la table sélectionnée a des relations avec d'autres tables (clés étrangères), vous devrez sélectionner les valeurs par défaut.

**Exemple pour "Bâtiments" :**
- **fosa_id** → Sélectionnez la FOSA à laquelle appartiennent les bâtiments
- **degradation_id** → Sélectionnez le type de dégradation par défaut

Ces valeurs seront utilisées pour tous les enregistrements du fichier Excel, sauf si vous spécifiez des valeurs différentes dans le fichier.

### Étape 3 : Télécharger le Fichier Modèle

1. Cliquez sur le bouton **"Télécharger le modèle Excel"**
2. Un fichier Excel sera téléchargé sur votre ordinateur
3. Le fichier contient :
   - Une ligne d'en-têtes avec les noms de colonnes
   - Des annotations pour les types de données
   - Des indications pour les clés étrangères
   - Une ligne d'exemple (à supprimer avant l'import)

**Exemple de modèle pour "Personnel" :**
```
nom [varchar] | prenom [varchar] | matricule [varchar] | grade [varchar] | fosa_id (FK -> fosas) [int] | categorie_id (FK -> categories) [int]
Exemple       | Exemple          | 12345              | Grade exemple  | 1                           | 1
```

### Étape 4 : Remplir et Importer le Fichier

#### Remplir le fichier Excel

1. Ouvrez le fichier modèle dans Excel ou LibreOffice
2. **IMPORTANT :** Ne modifiez PAS les en-têtes de colonnes
3. Supprimez la ligne d'exemple
4. Remplissez vos données :
   - Respectez les types de données indiqués
   - Pour les dates : format `AAAA-MM-JJ` (ex: 2025-11-23)
   - Pour les dates et heures : format `AAAA-MM-JJ HH:mm:ss`
   - Pour les booléens : 0 (Non) ou 1 (Oui)
   - Pour les nombres décimaux : utilisez le point (12.34)

5. **Gestion des clés étrangères :**

   **Option A :** Laissez vide si vous voulez utiliser les valeurs par défaut configurées à l'étape 2

   **Option B :** Remplissez avec les IDs spécifiques
   ```
   nom        | prenom | fosa_id | categorie_id
   Jean       | Dupont | 1       | 2
   Marie      | Martin | 1       | 3
   ```

6. Enregistrez le fichier

#### Importer le fichier

1. Cliquez sur **"Parcourir"** ou la zone de sélection de fichier
2. Sélectionnez votre fichier Excel rempli
3. Vérifiez que le nom du fichier apparaît
4. Cliquez sur **"Importer les données"**
5. Attendez que l'import se termine

## Résultats de l'Import

Après l'import, vous verrez un résumé :

### Résumé Global
- **Total** : Nombre total de lignes dans le fichier
- **Succès** : Nombre d'enregistrements importés avec succès
- **Erreurs** : Nombre d'enregistrements en échec

### Détails des Erreurs

Si des erreurs se sont produites, vous verrez :
- **Ligne** : Numéro de la ligne dans le fichier Excel
- **Erreur** : Description de l'erreur

**Erreurs courantes :**

1. **"Duplicate entry"**
   - Cause : Un enregistrement avec la même valeur unique existe déjà
   - Solution : Vérifiez les doublons dans vos données

2. **"Foreign key constraint fails"**
   - Cause : L'ID de clé étrangère n'existe pas
   - Solution : Vérifiez que les IDs référencés existent

3. **"Column cannot be null"**
   - Cause : Une colonne obligatoire est vide
   - Solution : Remplissez toutes les colonnes requises

4. **"Incorrect date value"**
   - Cause : Format de date incorrect
   - Solution : Utilisez le format AAAA-MM-JJ

## Exemples Pratiques

### Exemple 1 : Importer du Personnel

1. Sélectionnez **"Personnel"**
2. Configurez les clés étrangères :
   - FOSA : Sélectionnez "Centre de Santé Principal"
   - Catégorie : Sélectionnez "Médecin"
3. Téléchargez le modèle
4. Remplissez le fichier :
   ```
   nom    | prenom  | matricule | grade          | fosa_id | categorie_id
   Kamga  | Paul    | MED001    | Médecin Chef  |         |
   Ngoue  | Marie   | INF002    | Infirmière    |         | 2
   Mbida  | Jean    | LAB003    | Laborantin    | 2       | 3
   ```
   - Ligne 1 : Utilisera les valeurs par défaut pour fosa_id et categorie_id
   - Ligne 2 : Utilisera la valeur par défaut pour fosa_id, mais categorie_id = 2
   - Ligne 3 : Utilisera fosa_id = 2 et categorie_id = 3
5. Importez le fichier

### Exemple 2 : Importer des Équipements

1. Sélectionnez **"Équipements"**
2. Configurez **service_id** (sélectionnez le service)
3. Téléchargez le modèle
4. Remplissez :
   ```
   nom                | type           | date_acquisition | service_id
   Microscope Zeiss   | Laboratoire    | 2024-01-15      |
   Table d'opération  | Chirurgie      | 2024-02-20      |
   ```
5. Importez

## Conseils et Bonnes Pratiques

### ✅ À Faire

1. **Testez avec peu de lignes d'abord**
   - Importez 2-3 lignes pour vérifier que tout fonctionne
   - Une fois validé, importez le reste

2. **Vérifiez vos données avant l'import**
   - Pas de doublons
   - Formats corrects
   - IDs de clés étrangères valides

3. **Gardez une copie de votre fichier**
   - En cas d'erreur, vous pourrez corriger et réimporter

4. **Utilisez les valeurs par défaut**
   - Si plusieurs enregistrements ont les mêmes FK, configurez-les à l'étape 2

### ❌ À Éviter

1. Ne modifiez pas les en-têtes du fichier modèle
2. Ne laissez pas de lignes vides au milieu des données
3. Ne mettez pas de valeurs dans la colonne `id` (générée automatiquement)
4. N'oubliez pas les colonnes obligatoires

## Limites

- **Taille maximale de fichier** : 10 MB
- **Formats acceptés** : .xlsx, .xls uniquement
- **Encodage** : UTF-8 recommandé pour les caractères spéciaux

## Dépannage

### Le fichier ne s'importe pas

**Problème** : "Seuls les fichiers Excel sont acceptés"
- **Solution** : Vérifiez que votre fichier a l'extension .xlsx ou .xls

**Problème** : "Le fichier Excel est vide"
- **Solution** : Assurez-vous d'avoir au moins une ligne de données (en plus des en-têtes)

**Problème** : "Erreur d'authentification"
- **Solution** : Reconnectez-vous à l'application

### Toutes les lignes sont en erreur

**Problème** : "Foreign key constraint fails" pour toutes les lignes
- **Solution** : Vérifiez que vous avez bien sélectionné des valeurs valides pour les clés étrangères à l'étape 2

## Support

Pour toute assistance :
1. Vérifiez ce guide
2. Consultez les détails des erreurs dans le résultat d'import
3. Contactez votre administrateur système

---

**Version** : 1.0
**Dernière mise à jour** : Novembre 2025
