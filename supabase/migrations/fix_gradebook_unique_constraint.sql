-- Fix gradebook_entries table to add missing unique constraint
-- The API code expects to upsert on (user_id, item_type, item_id) but the constraint is missing

-- Add the unique constraint that the API code expects
ALTER TABLE gradebook_entries 
DROP CONSTRAINT IF EXISTS gradebook_entries_user_item_unique;

ALTER TABLE gradebook_entries 
ADD CONSTRAINT gradebook_entries_user_item_unique 
UNIQUE (user_id, item_type, item_id);

-- Create an index to improve query performance on this constraint
CREATE INDEX IF NOT EXISTS idx_gradebook_user_item 
ON gradebook_entries(user_id, item_type, item_id);

COMMENT ON CONSTRAINT gradebook_entries_user_item_unique ON gradebook_entries 
IS 'Ensures one gradebook entry per user per item - required for upsert operations';
