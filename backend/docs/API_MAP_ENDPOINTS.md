# API Map Endpoints - Documentation

Cette documentation décrit les endpoints API optimisés pour l'affichage des données sur la carte avec des jointures spatiales.

## Vue d'ensemble

**Tous les endpoints retournent maintenant les données géométriques avec jointures spatiales par défaut !**

- Les endpoints standards `GET /:id` retournent la hiérarchie complète avec `geom`
- Les endpoints `/map/*` sont toujours disponibles pour une compatibilité explicite
- Utilisation d'**INNER JOIN** pour les relations obligatoires
- Utilisation de **LEFT JOIN** pour les relations optionnelles
- Une seule requête récupère toute la hiérarchie géographique

## Hiérarchie géographique

```
Région
  └── District
       └── Aire de santé
            └── Formation sanitaire (FOSA)
```

---

## Endpoints Région

### GET `/api/v1/regions/:id`

Récupère une région avec sa hiérarchie complète (districts > aires > FOSAs).

**Paramètres:**
- `id`: ID de la région

**Réponse:** Structure complète avec jointures spatiales (voir exemple ci-dessous)

### GET `/api/v1/regions/map/all` (Alternative)

Récupère toutes les régions avec leur hiérarchie complète.

**Query Parameters:**
- `limit` (optional): Nombre maximum de résultats
- `offset` (optional): Offset pour la pagination

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nom": "Centre",
      "code": "CE",
      "geom": "...",
      "districts": [
        {
          "id": 10,
          "nom_ds": "Mfoundi",
          "code_ds": "MF",
          "geom": "...",
          "airesantes": [
            {
              "id": 100,
              "nom_as": "Efoulan",
              "code_as": "EF01",
              "geom": "...",
              "fosas": [
                {
                  "id": 1000,
                  "nom": "CS Efoulan",
                  "type": "CS",
                  "latitude": 3.8667,
                  "longitude": 11.5167,
                  "estFerme": false
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### GET `/api/v1/regions/map/:id`

Récupère une région spécifique avec toute sa hiérarchie.

**Paramètres:**
- `id`: ID de la région

**Réponse:** Même structure que `/map/all` mais pour une seule région

---

## Endpoints District

### GET `/api/v1/districts/map/all`

Récupère tous les districts avec leur région et leurs aires de santé.

**Query Parameters:**
- `limit` (optional): Nombre maximum de résultats
- `offset` (optional): Offset pour la pagination

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "nom_ds": "Mfoundi",
      "code_ds": "MF",
      "region": "Centre",
      "geom": "...",
      "regionId": 1,
      "region": {
        "id": 1,
        "nom": "Centre",
        "code": "CE",
        "geom": "..."
      },
      "airesantes": [
        {
          "id": 100,
          "nom_as": "Efoulan",
          "code_as": "EF01",
          "geom": "...",
          "fosas": [...]
        }
      ]
    }
  ]
}
```

### GET `/api/v1/districts/map/:id`

Récupère un district spécifique avec sa hiérarchie complète.

### GET `/api/v1/districts/map/region/:regionId`

Récupère tous les districts d'une région spécifique avec leur hiérarchie.

**Paramètres:**
- `regionId`: ID de la région

---

## Endpoints Aire de Santé

### GET `/api/v1/airesantes/map/all`

Récupère toutes les aires de santé avec leur district et leurs FOSAs.

**Query Parameters:**
- `limit` (optional): Nombre maximum de résultats
- `offset` (optional): Offset pour la pagination

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "nom_as": "Efoulan",
      "nom_dist": "Mfoundi",
      "code_as": "EF01",
      "area": 45.67,
      "geom": "...",
      "districtId": 10,
      "district": {
        "id": 10,
        "nom_ds": "Mfoundi",
        "code_ds": "MF",
        "region": "Centre",
        "geom": "..."
      },
      "fosas": [
        {
          "id": 1000,
          "nom": "CS Efoulan",
          "type": "CS",
          "latitude": 3.8667,
          "longitude": 11.5167,
          "estFerme": false
        }
      ]
    }
  ]
}
```

### GET `/api/v1/airesantes/map/:id`

Récupère une aire de santé avec sa hiérarchie complète (district > région).

### GET `/api/v1/airesantes/map/district/:districtId`

Récupère toutes les aires de santé d'un district spécifique.

**Paramètres:**
- `districtId`: ID du district

---

## Endpoints Formation Sanitaire (FOSA)

### GET `/api/v1/fosas/map/all`

Récupère toutes les formations sanitaires avec leur hiérarchie géographique complète.

**Query Parameters:**
- `limit` (optional): Nombre maximum de résultats
- `offset` (optional): Offset pour la pagination

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1000,
      "nom": "CS Efoulan",
      "type": "CS",
      "latitude": 3.8667,
      "longitude": 11.5167,
      "estFerme": false,
      "situation": "Public",
      "airesanteId": 100,
      "arrondissementId": 50,
      "airesante": {
        "id": 100,
        "nom_as": "Efoulan",
        "code_as": "EF01",
        "geom": "...",
        "district": {
          "id": 10,
          "nom_ds": "Mfoundi",
          "code_ds": "MF",
          "region": "Centre",
          "geom": "..."
        }
      },
      "arrondissement": {
        "id": 50,
        "nom": "Yaoundé 1er",
        "geom": "..."
      }
    }
  ]
}
```

### GET `/api/v1/fosas/map/:id`

Récupère une formation sanitaire avec sa hiérarchie complète (aire de santé > district > région + arrondissement).

### GET `/api/v1/fosas/map/airesante/:airesanteId`

Récupère toutes les formations sanitaires d'une aire de santé spécifique.

**Paramètres:**
- `airesanteId`: ID de l'aire de santé

---

## Types de jointures utilisées

### INNER JOIN (`required: true`)

Utilisé pour les relations obligatoires :
- Fosa → Aire de santé (toujours requis)
- Fosa → Arrondissement (toujours requis)
- Aire de santé → District (toujours requis)
- District → Région (toujours requis)

**Effet:** Ne retourne que les enregistrements ayant des relations valides.

### LEFT JOIN (`required: false`)

Utilisé pour les relations optionnelles :
- Région → Districts (une région peut ne pas avoir de districts)
- District → Aires de santé (un district peut ne pas avoir d'aires)
- Aire de santé → FOSAs (une aire peut ne pas avoir de FOSAs)

**Effet:** Retourne l'enregistrement même si la relation est vide.

---

## Avantages de cette approche

1. **Performance optimisée**
   - Une seule requête au lieu de plusieurs requêtes séparées
   - Réduction du nombre d'aller-retours à la base de données

2. **Données complètes**
   - Toute la hiérarchie géographique en une seule réponse
   - Données géométriques (geom) incluses pour le rendu sur carte

3. **Cohérence des données**
   - Les INNER JOIN garantissent que seules les données valides sont retournées
   - Pas de FOSAs orphelines sans aire de santé

4. **Facilité d'utilisation**
   - Une seule réponse contient toutes les informations nécessaires
   - Pas besoin de faire des requêtes supplémentaires côté client

---

## Exemples d'utilisation

### Afficher toutes les régions sur la carte

```javascript
const response = await fetch('/api/v1/regions/map/all');
const { data } = await response.json();

data.forEach(region => {
  // Dessiner la région sur la carte
  map.addPolygon(region.geom, {
    name: region.nom,
    code: region.code
  });

  // Dessiner les districts
  region.districts.forEach(district => {
    map.addPolygon(district.geom, {
      name: district.nom_ds,
      parent: region.nom
    });

    // Dessiner les aires de santé et FOSAs...
  });
});
```

### Afficher les FOSAs d'une aire de santé

```javascript
const airesanteId = 100;
const response = await fetch(`/api/v1/fosas/map/airesante/${airesanteId}`);
const { data } = await response.json();

data.forEach(fosa => {
  // Ajouter un marqueur pour chaque FOSA
  map.addMarker({
    lat: fosa.latitude,
    lng: fosa.longitude,
    title: fosa.nom,
    type: fosa.type,
    status: fosa.estFerme ? 'Fermé' : 'Ouvert'
  });
});
```

### Obtenir les détails complets d'un district

```javascript
const districtId = 10;
const response = await fetch(`/api/v1/districts/map/${districtId}`);
const { data } = await response.json();

console.log(`District: ${data.nom_ds}`);
console.log(`Région: ${data.region.nom}`);
console.log(`Nombre d'aires de santé: ${data.airesantes.length}`);
console.log(`Nombre total de FOSAs: ${
  data.airesantes.reduce((sum, as) => sum + as.fosas.length, 0)
}`);
```

---

## Notes importantes

1. Le champ `geom` contient les données géométriques au format WKB (Well-Known Binary)
2. Pour les FOSAs, utilisez `latitude` et `longitude` pour les coordonnées de point
3. Les endpoints `/map/*` sont publics et ne nécessitent pas d'authentification
4. La pagination est recommandée pour les endpoints `all` avec de grandes quantités de données
