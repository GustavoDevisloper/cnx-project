-- Test script for single policy
-- This can be run in Supabase SQL Editor to test a specific policy in isolation

-- Create a simple test table
CREATE TABLE IF NOT EXISTS test_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE test_table ENABLE ROW LEVEL SECURITY;

-- Add a basic policy - this syntax should be valid for Supabase
CREATE POLICY "test_select_policy" 
ON test_table FOR SELECT 
TO authenticated 
USING (true);

-- Add a basic insert policy with simple WITH CHECK
CREATE POLICY "test_insert_policy" 
ON test_table FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Comment on test procedure:
-- 1. Run this script in Supabase SQL Editor
-- 2. If this works, the issue is likely with specific policy logic
-- 3. If this fails, the issue is likely with the SQL syntax or Supabase configuration 