/*
  # Complete Schema Recreation

  1. Changes
    - Drop all existing tables
    - Recreate tables with proper relationships:
      - users (managed by Supabase Auth)
      - lists (for todo lists)
      - list_items (for items within lists)
      - shared_lists (for list sharing)
    
  2. Security
    - Enable RLS on all tables
    - Set up clear, non-recursive policies
    - Ensure proper cascading deletes
*/

-- Drop existing tables (in correct order)
DROP TABLE IF EXISTS list_items CASCADE;
DROP TABLE IF EXISTS shared_lists CASCADE;
DROP TABLE IF EXISTS lists CASCADE;

-- Create lists table
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create list_items table
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create shared_lists table
CREATE TABLE shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, shared_with)
);

-- Enable Row Level Security
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;

-- Lists policies
CREATE POLICY "Users can manage their own lists"
  ON lists
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view shared lists"
  ON lists
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT list_id
      FROM shared_lists
      WHERE shared_with = auth.uid()
    )
  );

-- List items policies
CREATE POLICY "Users can manage items in their lists"
  ON list_items
  TO authenticated
  USING (
    list_id IN (
      SELECT id FROM lists WHERE user_id = auth.uid()
      UNION
      SELECT list_id FROM shared_lists WHERE shared_with = auth.uid()
    )
  );

-- Shared lists policies
CREATE POLICY "Users can share their own lists"
  ON shared_lists
  TO authenticated
  USING (
    list_id IN (
      SELECT id FROM lists WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    list_id IN (
      SELECT id FROM lists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their shared lists"
  ON shared_lists
  FOR SELECT
  TO authenticated
  USING (
    list_id IN (SELECT id FROM lists WHERE user_id = auth.uid())
    OR
    shared_with = auth.uid()
  );

-- Create indexes for better performance
CREATE INDEX idx_list_items_list_id ON list_items(list_id);
CREATE INDEX idx_shared_lists_list_id ON shared_lists(list_id);
CREATE INDEX idx_shared_lists_shared_with ON shared_lists(shared_with);