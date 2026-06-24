-- Enforce unique organization names for public MVP organization discovery.
-- Existing duplicate rows must be resolved before running this migration.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chat_room;

DROP PROCEDURE IF EXISTS add_unique_organization_name;

DELIMITER //
CREATE PROCEDURE add_unique_organization_name()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'organization'
      AND index_name = 'uk_organization_name'
  ) THEN
    ALTER TABLE organization ADD UNIQUE KEY uk_organization_name (name);
  END IF;
END //
DELIMITER ;

CALL add_unique_organization_name();
DROP PROCEDURE IF EXISTS add_unique_organization_name;
