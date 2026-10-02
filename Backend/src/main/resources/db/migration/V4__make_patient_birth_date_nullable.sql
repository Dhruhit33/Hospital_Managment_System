-- V4__make_patient_birth_date_nullable.sql
-- Allow patient registration without requiring immediate birth date or blood group entry

ALTER TABLE patient MODIFY COLUMN birth_date DATE NULL;
ALTER TABLE patient MODIFY COLUMN blood_group VARCHAR(10) NULL;
