-- Script to drop the freefire_username_key constraint
-- Run this in Supabase SQL Editor

-- Check if the constraint exists and drop it
DO $$
DECLARE
  constraint_exists boolean;
BEGIN
  -- Check if the constraint exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'freefire_username_key'
  ) INTO constraint_exists;
  
  -- Drop the constraint if it exists
  IF constraint_exists THEN
    EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS freefire_username_key';
    RAISE NOTICE 'Constraint freefire_username_key has been dropped successfully';
  ELSE
    RAISE NOTICE 'Constraint freefire_username_key does not exist';
  END IF;
END
$$; 