-- Script pour corriger les noms de régions en anglais dans la table districts

-- 1. Corriger les noms de régions de l'anglais vers le français
UPDATE districts SET region = 'Nord-Ouest' WHERE region = 'North West';
UPDATE districts SET region = 'Sud-Ouest' WHERE region = 'South West';
UPDATE districts SET region = 'Extreme-Nord' WHERE region = 'Extreme Nord';

-- 2. Mettre à jour les regionId pour Nord-Ouest
UPDATE districts d
INNER JOIN regions r ON r.nom = 'Nord-Ouest'
SET d.region_id = r.id
WHERE d.region = 'Nord-Ouest' AND (d.region_id IS NULL OR d.region_id = 0);

-- 3. Mettre à jour les regionId pour Sud-Ouest
UPDATE districts d
INNER JOIN regions r ON r.nom = 'Sud-Ouest'
SET d.region_id = r.id
WHERE d.region = 'Sud-Ouest' AND (d.region_id IS NULL OR d.region_id = 0);

-- 4. Mettre à jour les regionId pour Extreme-Nord
UPDATE districts d
INNER JOIN regions r ON r.nom = 'Extreme-Nord'
SET d.region_id = r.id
WHERE d.region = 'Extreme-Nord' AND (d.region_id IS NULL OR d.region_id = 0);

-- 5. Vérifier les résultats
SELECT
    COUNT(*) as total_districts,
    SUM(CASE WHEN region_id IS NOT NULL AND region_id > 0 THEN 1 ELSE 0 END) as with_region_id,
    SUM(CASE WHEN region_id IS NULL OR region_id = 0 THEN 1 ELSE 0 END) as without_region_id
FROM districts;

-- 6. Afficher les districts sans regionId (s'il y en a)
SELECT id, nom_ds, region, region_id
FROM districts
WHERE region_id IS NULL OR region_id = 0
ORDER BY region;
