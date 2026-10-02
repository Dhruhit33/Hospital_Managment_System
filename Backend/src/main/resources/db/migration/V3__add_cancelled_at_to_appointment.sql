-- V3__add_cancelled_at_to_appointment.sql
-- Adds cancelled_at column to appointment table for auto-deletion/retention tracking

DROP PROCEDURE IF EXISTS AddCancelledAtColumn;

DELIMITER $$
CREATE PROCEDURE AddCancelledAtColumn()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
          AND table_name = 'appointment' 
          AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE appointment ADD COLUMN cancelled_at DATETIME NULL;
    END IF;
END$$
DELIMITER ;

CALL AddCancelledAtColumn();
DROP PROCEDURE IF EXISTS AddCancelledAtColumn;
