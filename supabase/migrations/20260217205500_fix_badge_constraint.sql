-- Fix badge_attachments check constraint to include 'course'

ALTER TABLE badge_attachments DROP CONSTRAINT IF EXISTS badge_attachments_entity_type_check;

ALTER TABLE badge_attachments ADD CONSTRAINT badge_attachments_entity_type_check 
    CHECK (entity_type IN ('achievement', 'task', 'project', 'module', 'stage', 'course'));
