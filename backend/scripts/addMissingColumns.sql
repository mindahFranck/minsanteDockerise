-- Script pour ajouter les colonnes manquantes

-- 1. Ajouter 'capitale' à la table regions
ALTER TABLE regions ADD COLUMN IF NOT EXISTS capitale VARCHAR(191) NULL AFTER nom;

-- 2. Ajouter 'nom' à la table batiments
ALTER TABLE batiments ADD COLUMN IF NOT EXISTS nom VARCHAR(200) NULL AFTER id;

-- 3. Ajouter 'nom' à la table equipements
ALTER TABLE equipements ADD COLUMN IF NOT EXISTS nom VARCHAR(200) NULL AFTER id;

-- Vérifier les colonnes ajoutées
SELECT 'regions' as table_name, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'regions' AND COLUMN_NAME = 'capitale'
UNION ALL
SELECT 'batiments', COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'batiments' AND COLUMN_NAME = 'nom'
UNION ALL
SELECT 'equipements', COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'equipements' AND COLUMN_NAME = 'nom';
