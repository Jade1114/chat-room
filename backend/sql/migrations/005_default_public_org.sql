-- Current product mode: single public organization.
-- Keep organization fields for future multi-org invite/self-management flows,
-- but backfill existing users into the public school for the current MVP.

USE chat_room;

ALTER TABLE campus_user
    MODIFY school_id VARCHAR(32) NULL DEFAULT 'school-1';

UPDATE campus_user
SET school_id = 'school-1'
WHERE school_id IS NULL;
