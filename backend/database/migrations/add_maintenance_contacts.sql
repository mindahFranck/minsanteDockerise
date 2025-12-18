-- Migration: Add maintenance and contact fields to tmpfosa table

-- Add maintenance fields
ALTER TABLE tmpfosa ADD COLUMN last_inspection DATE NULL;
ALTER TABLE tmpfosa ADD COLUMN next_inspection DATE NULL;
ALTER TABLE tmpfosa ADD COLUMN maintenance_priority ENUM('low', 'medium', 'high', 'urgent') NULL DEFAULT 'low';
ALTER TABLE tmpfosa ADD COLUMN maintenance_issues TEXT NULL COMMENT 'JSON array of maintenance issues';

-- Add contact fields
ALTER TABLE tmpfosa ADD COLUMN telephone VARCHAR(20) NULL;
ALTER TABLE tmpfosa ADD COLUMN email VARCHAR(100) NULL;
ALTER TABLE tmpfosa ADD COLUMN responsable_nom VARCHAR(200) NULL;
ALTER TABLE tmpfosa ADD COLUMN responsable_telephone VARCHAR(20) NULL;
