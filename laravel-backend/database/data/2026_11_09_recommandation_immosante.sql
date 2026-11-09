-- =============================================================================
-- Recommandation ImmoSanté — ajout des colonnes (production)
-- À exécuter sur la base MariaDB de production (le VPS n'exécute pas les
-- migrations Laravel). Idempotent : `ADD COLUMN IF NOT EXISTS`.
--   Exemple : mysql -u <user> -p <base> < 2026_11_09_recommandation_immosante.sql
-- =============================================================================

-- --- FOSA (table réelle : tmpfosa) -----------------------------------------
ALTER TABLE `tmpfosa`
  ADD COLUMN IF NOT EXISTS `site` TINYINT(1) NOT NULL DEFAULT 1
    COMMENT 'La FOSA fonctionne-t-elle sur son site de création ?';

-- --- Équipements (non biomédicaux) -----------------------------------------
ALTER TABLE `equipements`
  ADD COLUMN IF NOT EXISTS `marque` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `modele` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `numero_serie` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `annee_fabrication` INT NULL,
  ADD COLUMN IF NOT EXISTS `source_acquisition` VARCHAR(20) NULL COMMENT 'BIP|PTF|DON|ACHAT',
  ADD COLUMN IF NOT EXISTS `etat` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `contrat_maintenance` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `type_maintenance` VARCHAR(50) NULL COMMENT 'Préventive|Curative',
  ADD COLUMN IF NOT EXISTS `date_derniere_maintenance` DATE NULL,
  ADD COLUMN IF NOT EXISTS `date_prochaine_maintenance` DATE NULL,
  ADD COLUMN IF NOT EXISTS `duree_garantie` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `date_fin_garantie` DATE NULL;

-- --- Équipements biomédicaux (+ catégorie FOSA) ----------------------------
ALTER TABLE `equipebios`
  ADD COLUMN IF NOT EXISTS `marque` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `modele` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `numero_serie` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `annee_fabrication` INT NULL,
  ADD COLUMN IF NOT EXISTS `source_acquisition` VARCHAR(20) NULL COMMENT 'BIP|PTF|DON|ACHAT',
  ADD COLUMN IF NOT EXISTS `etat` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `contrat_maintenance` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `type_maintenance` VARCHAR(50) NULL COMMENT 'Préventive|Curative',
  ADD COLUMN IF NOT EXISTS `date_derniere_maintenance` DATE NULL,
  ADD COLUMN IF NOT EXISTS `date_prochaine_maintenance` DATE NULL,
  ADD COLUMN IF NOT EXISTS `duree_garantie` VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS `date_fin_garantie` DATE NULL,
  ADD COLUMN IF NOT EXISTS `categorie_fosa` VARCHAR(50) NULL COMMENT 'HR|HD|CMA|CSI pour la liste standard';

-- --- Matériel roulant ------------------------------------------------------
ALTER TABLE `materielroulants`
  ADD COLUMN IF NOT EXISTS `image` VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS `nombre_places` INT NULL,
  ADD COLUMN IF NOT EXISTS `source_acquisition` VARCHAR(20) NULL COMMENT 'BIP|PTF|ACHAT|DON',
  ADD COLUMN IF NOT EXISTS `puissance_fiscale` INT NULL COMMENT 'Chevaux fiscaux';

-- Reprise de données : si `financement` était utilisé, on initialise
-- `source_acquisition` avec sa valeur (sans écraser une valeur déjà saisie).
UPDATE `materielroulants`
  SET `source_acquisition` = `financement`
  WHERE (`source_acquisition` IS NULL OR `source_acquisition` = '')
    AND `financement` IS NOT NULL AND `financement` <> '';
