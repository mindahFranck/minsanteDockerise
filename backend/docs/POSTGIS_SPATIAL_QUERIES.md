# PostGIS Spatial Queries - Documentation

Cette documentation explique l'utilisation des fonctions spatiales PostGIS pour les requêtes géographiques avancées.

## Vue d'ensemble

Les endpoints `/spatial/*` utilisent de **vraies jointures spatiales** avec les fonctions PostGIS plutôt que des jointures basées sur les clés étrangères. Cela permet des requêtes géographiques plus précises et gère les cas où les relations FK pourraient être manquantes ou incorrectes.

## Fonctions PostGIS utilisées

### ST_Within(geometry A, geometry B)

Retourne `true` si la géométrie A est complètement à l'intérieur de la géométrie B.

```sql
-- Trouver tous les districts dans une région
SELECT d.*
FROM districts d
JOIN regions r ON ST_Within(d.geom, r.geom)
WHERE r.id = 1
```

**Utilisation:** Vérifier qu'un polygone (district) est à l'intérieur d'un autre polygone (région).

### ST_DWithin(geometry A, geometry B, distance)

Retourne `true` si la distance entre A et B est inférieure ou égale à `distance` (en degrés décimaux).

```sql
-- Trouver les FOSAs dans un rayon de 0.1 degrés (~11km) d'une aire de santé
SELECT f.*
FROM fosas f
JOIN airesantes a ON ST_DWithin(
  ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
  a.geom,
  0.1
)
WHERE a.id = 100
```

**Utilisation:** Trouver des points (FOSAs) près d'un polygone (aire de santé).

### ST_AsGeoJSON(geometry)

Convertit une géométrie en format GeoJSON, directement utilisable par les bibliothèques de cartographie comme Leaflet, Mapbox, etc.

```sql
SELECT
  id,
  nom,
  ST_AsGeoJSON(geom) as geojson
FROM regions
```

**Résultat:**
```json
{
  "id": 1,
  "nom": "Centre",
  "geojson": "{\"type\":\"MultiPolygon\",\"coordinates\":[[[...]]]}"
}
```

### ST_SetSRID(geometry, srid)

Définit le système de référence spatiale (SRID) d'une géométrie. 4326 = WGS84 (GPS standard).

### ST_MakePoint(longitude, latitude)

Crée un point géométrique à partir de coordonnées.

```sql
-- Créer un point à partir des coordonnées d'un FOSA
ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326)
```

---

## Endpoints disponibles

### Région avec jointures spatiales

**GET `/api/v1/regions/spatial/:id`**

Récupère une région avec tous ses districts, aires de santé et FOSAs via jointures spatiales `ST_Within`.

**Exemple de requête SQL:**
```sql
SELECT
  r.id as region_id,
  r.nom as region_nom,
  ST_AsGeoJSON(r.geom) as region_geojson,
  d.id as district_id,
  d.nom_ds as district_nom,
  ST_AsGeoJSON(d.geom) as district_geojson,
  a.id as airesante_id,
  a.nom_as as airesante_nom,
  ST_AsGeoJSON(a.geom) as airesante_geojson,
  f.id as fosa_id,
  f.nom as fosa_nom,
  f.latitude,
  f.longitude
FROM regions r
LEFT JOIN districts d ON ST_Within(d.geom, r.geom) OR d.region_id = r.id
LEFT JOIN airesantes a ON ST_Within(a.geom, d.geom) OR a.district_id = d.id
LEFT JOIN fosas f ON ST_DWithin(
  ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
  a.geom,
  0.1
) OR f.airesante_id = a.id
WHERE r.id = :regionId
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nom": "Centre",
    "code": "CE",
    "geojson": {
      "type": "MultiPolygon",
      "coordinates": [[...]]
    },
    "districts": [
      {
        "id": 10,
        "nom": "Mfoundi",
        "code": "MF",
        "geojson": {...},
        "airesantes": [
          {
            "id": 100,
            "nom": "Efoulan",
            "code": "EF01",
            "geojson": {...},
            "fosas": [
              {
                "id": 1000,
                "nom": "CS Efoulan",
                "type": "CS",
                "latitude": 3.8667,
                "longitude": 11.5167
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

### FOSAs dans une région (spatial)

**GET `/api/v1/fosas/spatial/region/:regionId`**

Récupère tous les FOSAs d'une région via jointures spatiales.

**Requête SQL:**
```sql
SELECT
  f.id, f.nom, f.type, f.latitude, f.longitude,
  a.id as airesante_id,
  a.nom_as as airesante_nom,
  ST_AsGeoJSON(a.geom) as airesante_geojson,
  d.id as district_id,
  d.nom_ds as district_nom,
  ST_AsGeoJSON(d.geom) as district_geojson,
  r.id as region_id,
  r.nom as region_nom,
  ST_AsGeoJSON(r.geom) as region_geojson
FROM fosas f
INNER JOIN airesantes a ON f.airesante_id = a.id
INNER JOIN districts d ON a.district_id = d.id
INNER JOIN regions r ON ST_Within(d.geom, r.geom) AND r.id = :regionId
ORDER BY d.nom_ds, a.nom_as, f.nom
```

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
      "airesante": {
        "id": 100,
        "nom": "Efoulan",
        "geojson": {...}
      },
      "district": {
        "id": 10,
        "nom": "Mfoundi",
        "geojson": {...}
      },
      "region": {
        "id": 1,
        "nom": "Centre",
        "geojson": {...}
      }
    }
  ],
  "count": 150
}
```

---

### FOSAs dans un district (spatial)

**GET `/api/v1/fosas/spatial/district/:districtId`**

Récupère tous les FOSAs d'un district via `ST_Within`.

**Requête SQL:**
```sql
SELECT
  f.id, f.nom, f.type, f.latitude, f.longitude,
  a.id as airesante_id,
  a.nom_as as airesante_nom,
  ST_AsGeoJSON(a.geom) as airesante_geojson,
  d.id as district_id,
  d.nom_ds as district_nom,
  ST_AsGeoJSON(d.geom) as district_geojson
FROM fosas f
INNER JOIN airesantes a ON f.airesante_id = a.id
INNER JOIN districts d ON ST_Within(a.geom, d.geom) AND d.id = :districtId
ORDER BY a.nom_as, f.nom
```

---

### FOSAs dans une aire de santé (spatial)

**GET `/api/v1/fosas/spatial/airesante/:airesanteId`**

Récupère tous les FOSAs d'une aire de santé via `ST_DWithin` (distance).

**Requête SQL:**
```sql
SELECT
  f.id, f.nom, f.type, f.latitude, f.longitude,
  a.id as airesante_id,
  a.nom_as as airesante_nom,
  ST_AsGeoJSON(a.geom) as airesante_geojson
FROM fosas f
INNER JOIN airesantes a ON ST_DWithin(
  ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
  a.geom,
  0.1
) AND a.id = :airesanteId
ORDER BY f.nom
```

**Note:** Utilise `ST_DWithin` avec 0.1 degré (~11km) pour trouver les FOSAs proches de l'aire de santé.

---

## Avantages des jointures spatiales

### 1. Précision géographique

Les jointures spatiales vérifient la **vraie position géographique** plutôt que de se fier uniquement aux clés étrangères.

```sql
-- Avec FK (peut être incorrecte)
JOIN districts d ON a.district_id = d.id

-- Avec spatial (toujours correcte)
JOIN districts d ON ST_Within(a.geom, d.geom)
```

### 2. Gestion des données manquantes

Si un FOSA a des coordonnées mais pas de `airesante_id`, la jointure spatiale peut quand même le trouver :

```sql
-- Trouve les FOSAs même sans FK
LEFT JOIN fosas f ON ST_DWithin(
  ST_MakePoint(f.longitude, f.latitude),
  a.geom,
  0.1
)
```

### 3. Format prêt pour la carte

`ST_AsGeoJSON` retourne directement du GeoJSON utilisable par Leaflet, Mapbox, etc.

```javascript
// Utilisation directe dans Leaflet
const geojson = JSON.parse(region.geojson);
L.geoJSON(geojson).addTo(map);
```

### 4. Requêtes complexes

Permet des requêtes spatiales avancées :

```sql
-- FOSAs à moins de 5km d'un point
ST_DWithin(
  ST_MakePoint(f.longitude, f.latitude),
  ST_MakePoint(11.5167, 3.8667),
  0.05
)

-- Aires de santé qui se chevauchent
ST_Overlaps(a1.geom, a2.geom)

-- Distance entre deux FOSAs
ST_Distance(
  ST_MakePoint(f1.longitude, f1.latitude),
  ST_MakePoint(f2.longitude, f2.latitude)
)
```

---

## Comparaison : ORM vs Spatial

### Approche ORM (Sequelize)

```typescript
// Jointure basée sur FK
const fosas = await Fosa.findAll({
  include: [
    {
      association: "airesante",
      required: true,
      include: [
        {
          association: "district",
          where: { id: districtId }
        }
      ]
    }
  ]
});
```

**Limitations:**
- Dépend des FK (peuvent être incorrectes)
- Pas de vérification géographique réelle
- Géométries en format binaire (WKB)

### Approche Spatiale (PostGIS)

```typescript
// Jointure basée sur la géographie
const query = `
  SELECT f.*, ST_AsGeoJSON(a.geom) as geojson
  FROM fosas f
  JOIN airesantes a ON ST_DWithin(
    ST_MakePoint(f.longitude, f.latitude),
    a.geom,
    0.1
  )
  JOIN districts d ON ST_Within(a.geom, d.geom)
  WHERE d.id = :districtId
`;
```

**Avantages:**
- Vérification géographique réelle
- GeoJSON prêt à l'emploi
- Gère les données sans FK
- Plus flexible pour les requêtes complexes

---

## Exemples d'utilisation

### Afficher tous les FOSAs d'une région sur une carte

```javascript
const response = await fetch('/api/v1/fosas/spatial/region/1');
const { data } = await response.json();

// Ajouter la région
const regionGeoJSON = data.region.geojson;
L.geoJSON(regionGeoJSON, {
  style: { color: '#3388ff', weight: 2 }
}).addTo(map);

// Ajouter les districts
data.forEach(fosa => {
  const districtGeoJSON = fosa.district.geojson;
  L.geoJSON(districtGeoJSON, {
    style: { color: '#00ff00', weight: 1 }
  }).addTo(map);

  // Ajouter un marqueur pour le FOSA
  L.marker([fosa.latitude, fosa.longitude])
    .bindPopup(`<b>${fosa.nom}</b><br>Type: ${fosa.type}`)
    .addTo(map);
});
```

### Trouver les FOSAs proches d'un point

```sql
-- Requête personnalisée
SELECT
  f.id,
  f.nom,
  ST_Distance(
    ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
    ST_SetSRID(ST_MakePoint(11.5167, 3.8667), 4326)
  ) * 111 as distance_km
FROM fosas f
WHERE ST_DWithin(
  ST_SetSRID(ST_MakePoint(f.longitude, f.latitude), 4326),
  ST_SetSRID(ST_MakePoint(11.5167, 3.8667), 4326),
  0.05
)
ORDER BY distance_km
```

---

## Performance

### Index spatiaux

Pour optimiser les requêtes spatiales, assurez-vous que les index GIST sont créés :

```sql
-- Créer des index spatiaux
CREATE INDEX idx_regions_geom ON regions USING GIST(geom);
CREATE INDEX idx_districts_geom ON districts USING GIST(geom);
CREATE INDEX idx_airesantes_geom ON airesantes USING GIST(geom);
CREATE INDEX idx_arrondissements_geom ON arrondissements USING GIST(geom);

-- Index pour les points (FOSAs)
CREATE INDEX idx_fosas_point ON fosas USING GIST(
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);
```

### Conseils de performance

1. **Utilisez les index GIST** pour toutes les colonnes géométriques
2. **Limitez la profondeur des jointures** si possible
3. **Utilisez ST_Intersects au lieu de ST_Within** si la précision n'est pas critique
4. **Ajoutez WHERE avant les jointures spatiales** pour réduire le dataset

---

## Notes importantes

1. **SRID 4326** : Toutes les géométries utilisent le système WGS84 (GPS standard)
2. **Distance en degrés** : 0.1 degré ≈ 11 km à l'équateur
3. **Format GeoJSON** : Directement utilisable sans conversion
4. **Fallback sur FK** : Les requêtes utilisent `OR FK_id` comme fallback si la géométrie manque

---

## Références

- [PostGIS Documentation](https://postgis.net/docs/)
- [ST_Within](https://postgis.net/docs/ST_Within.html)
- [ST_DWithin](https://postgis.net/docs/ST_DWithin.html)
- [ST_AsGeoJSON](https://postgis.net/docs/ST_AsGeoJSON.html)
- [GeoJSON Format](https://geojson.org/)
