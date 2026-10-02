-- V2__rename_patinet_to_patient.sql
-- Idempotent rename for databases upgraded from earlier revisions where table was named 'patinet'

DROP PROCEDURE IF EXISTS RenamePatinetTable;

DELIMITER $$
CREATE PROCEDURE RenamePatinetTable()
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = DATABASE() AND table_name = 'patinet'
    ) THEN
        RENAME TABLE patinet TO patient;
    END IF;
END$$
DELIMITER ;

CALL RenamePatinetTable();
DROP PROCEDURE IF EXISTS RenamePatinetTable;
