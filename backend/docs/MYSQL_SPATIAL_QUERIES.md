# MySQL Spatial Queries - Documentation

Cette documentation explique l'utilisation des fonctions spatiales MySQL pour les requêtes géographiques.

## Différences MySQL vs PostGIS

| PostGIS (PostgreSQL) | MySQL | Description |
|---------------------|-------|-------------|
| `ST_Within(a, b)` | `ST_Contains(b, a)` | Vérifie si a est dans b (ordre inversé!) |
| `ST_DWithin(a, b, distance)` | `ST_Distance(a, b) <= distance` | Distance en degrés |
| `ST_SetSRID(geom, 4326)` | `ST_SRID(geom, 4326)` ou pas nécessaire | MySQL gère automatiquement |
| `ST_MakePoint(lon, lat)` | `POINT(lon, lat)` | Création de point |
| `ST_AsGeoJSON(geom)` | `ST_AsGeoJSON(geom)` | Identique ✅ |

## Fonctions MySQL utilisées

### ST_Contains(polygon, point)

**Attention**: L'ordre des paramètres est inversé par rapport à PostGIS `ST_Within`!

```sql
-- PostGIS: ST_Within(district.geom, region.geom)
-- MySQL:    ST_Contains(region.geom, district.geom)

SELECT d.*
FROM districts d
JOIN regions r ON ST_Contains(r.geom, d.geom)
WHERE r.id = 1
```

### ST_Distance(geom1, geom2)

Retourne la distance en degrés décimaux (≈111km par degré à l'équateur).

```sql
-- Trouver les FOSAs à moins de 0.1 degrés (~11km) d'une aire de santé
SELECT f.*
FROM fosas f
JOIN airesantes a ON ST_Distance(
  POINT(f.longitude, f.latitude),
  a.geom
) <= 0.1
WHERE a.id = 100
```

### POINT(longitude, latitude)

Crée un point géométrique.

```sql
-- Créer un point à partir des coordonnées d'un FOSA
POINT(f.longitude, f.latitude)
```

### ST_AsGeoJSON(geometry)

Identique à PostGIS - convertit une géométrie en format GeoJSON.

```sql
SELECT
  id,
  nom,
  ST_AsGeoJSON(geom) as geojson
FROM regions
```

## Exemples de requêtes

### Districts dans une région

```sql
SELECT
  d.id as district_id,
  d.nom_ds as district_nom,
  ST_AsGeoJSON(d.geom) as district_geojson,
  r.id as region_id,
  r.nom as region_nom,
  ST_AsGeoJSON(r.geom) as region_geojson
FROM districts d
INNER JOIN regions r ON ST_Contains(r.geom, d.geom) OR d.region_id = r.id
WHERE r.id = :regionId
```

### FOSAs près d'une aire de santé

```sql
SELECT
  f.id,
  f.nom,
  f.latitude,
  f.longitude,
  a.id as airesante_id,
  a.nom_as as airesante_nom,
  ST_AsGeoJSON(a.geom) as airesante_geojson
FROM fosas f
INNER JOIN airesantes a ON (
  ST_Distance(POINT(f.longitude, f.latitude), a.geom) <= 0.1
) OR f.airesante_id = a.id
WHERE a.id = :airesanteId
ORDER BY f.nom
```

## Notes importantes

1. **Ordre des paramètres**: `ST_Contains(grand, petit)` vs PostGIS `ST_Within(petit, grand)`
2. **Distance en degrés**: 0.1 degré ≈ 11 km à l'équateur
3. **SRID**: MySQL utilise 4326 (WGS84) par défaut pour les géométries
4. **Performance**: Créez des index SPATIAL sur les colonnes geom
5. **Fallback FK**: Utilisez toujours `OR table.fk_id = parent.id` pour les données sans géométrie

## Création d'index spatiaux

```sql
-- Index pour optimiser les requêtes spatiales
CREATE SPATIAL INDEX idx_regions_geom ON regions(geom);
CREATE SPATIAL INDEX idx_districts_geom ON districts(geom);
CREATE SPATIAL INDEX idx_airesantes_geom ON airesantes(geom);
CREATE SPATIAL INDEX idx_arrondissements_geom ON arrondissements(geom);
```

## Références

- [MySQL Spatial Functions](https://dev.mysql.com/doc/refman/8.0/en/spatial-function-reference.html)
- [ST_Contains](https://dev.mysql.com/doc/refman/8.0/en/spatial-relation-functions-object-shapes.html#function_st-contains)
- [ST_Distance](https://dev.mysql.com/doc/refman/8.0/en/spatial-relation-functions-mbr.html#function_st-distance)
- [ST_AsGeoJSON](https://dev.mysql.com/doc/refman/8.0/en/spatial-geojson-functions.html#function_st-asgeojson)
