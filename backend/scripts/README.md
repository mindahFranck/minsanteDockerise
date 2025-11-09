# Scripts de données - Manuel d'utilisation

## ⚠️ Scripts à exécuter MANUELLEMENT (une seule fois)

Ces scripts ne doivent être exécutés qu'une seule fois pour initialiser ou corriger les données.

### 1. Chargement initial des données

```bash
# Charger les districts (188 districts)
node scripts/loadDistricts.js

# Charger les aires de santé (193 aires)
node scripts/loadAiresantes.js
```

**Statut** : ✅ Déjà exécuté

---

### 2. Correction des noms de régions

**Problème** : Certaines régions dans `districts` sont en anglais au lieu de français.

```bash
node scripts/fixRegionNames.js
```

**OU** via SQL direct :
```bash
mysql -h srv915.hstgr.io -u u877916646_minsante -p u877916646_minstante < scripts/fixRegionNames.sql
```

**Ce que ça fait** :
- `North West` → `Nord-Ouest`
- `South West` → `Sud-Ouest`
- `Extreme Nord` → `Extreme-Nord`

**Statut** : ⏳ À exécuter

---

### 3. Mise à jour des relations ID

**Problème** : Remplir `region_id` dans districts et `district_id` dans airesantes.

```bash
node scripts/updateRelations.js
```

**Ce que ça fait** :
- Met à jour `districts.region_id` basé sur `districts.region` → `regions.nom`
- Met à jour `airesantes.district_id` basé sur `airesantes.nom_dist` → `districts.nom_ds`

**Statut** : ⚠️ Déjà exécuté mais à ré-exécuter après fixRegionNames pour mettre à jour les 67 districts manquants

---

## 🔄 Ce qui s'exécute automatiquement au déploiement

### Migrations de base de données

Les migrations modifient la **structure** des tables (ajout de colonnes, index, etc.) :

```bash
npm run db:migrate
```

**Exemple** :
- Ajouter la colonne `capitale` à la table `regions`
- Ajouter la colonne `nom` à la table `batiments`

⚠️ **Les migrations ne modifient PAS les données**, seulement la structure.

---

## 📋 Ordre d'exécution recommandé

Pour une installation propre depuis zéro :

1. **Créer la structure** (automatique au déploiement)
   ```bash
   npm run db:migrate
   ```

2. **Charger les données géographiques**
   ```bash
   node scripts/loadDistricts.js
   node scripts/loadAiresantes.js
   ```

3. **Corriger les noms de régions**
   ```bash
   node scripts/fixRegionNames.js
   ```

4. **Établir les relations ID**
   ```bash
   node scripts/updateRelations.js
   ```

---

## 🚨 Erreurs communes

### "Region_id est à 0 pour certains districts"

**Cause** : Les noms de régions ne correspondent pas entre `districts` et `regions`.

**Solution** : Exécuter `fixRegionNames.js` puis `updateRelations.js` à nouveau.

### "Timeout de connexion"

**Cause** : Base de données inaccessible temporairement.

**Solution** : Réessayer plus tard ou utiliser les scripts SQL directement.

---

## 📊 Vérification des données

Pour vérifier que tout est OK :

```sql
-- Vérifier les districts
SELECT
    COUNT(*) as total,
    SUM(CASE WHEN region_id > 0 THEN 1 ELSE 0 END) as with_region_id
FROM districts;
-- Devrait retourner : total=188, with_region_id=188

-- Vérifier les aires de santé
SELECT
    COUNT(*) as total,
    SUM(CASE WHEN district_id > 0 THEN 1 ELSE 0 END) as with_district_id
FROM airesantes;
-- Devrait retourner : total=193, with_district_id=193
```
