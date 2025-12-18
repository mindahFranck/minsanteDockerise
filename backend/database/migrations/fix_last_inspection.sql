-- Fix: Add missing last_inspection column
ALTER TABLE tmpfosa ADD COLUMN last_inspection DATE NULL;
