/*
  # Add List Sharing Feature

  1. New Tables
    - `shared_lists`: Track list sharing between users
      - `id` (uuid, primary key)
      - `list_id` (uuid, references lists)
      - `shared_with` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Changes
    - Add shared_lists table
    - Update list_items policies to allow access for shared users
    
  3. Security
    - Enable RLS on shared_lists table
    - Add policies for managing shared lists
    - Update list_items policies to allow shared users to manage items
*/

-- Create shared_lists table
CREATE TABLE shared_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, shared_with)
);

-- Enable Row Level Security
ALTER TABLE shared_lists ENABLE ROW LEVEL SECURITY;

-- Update list_items policies to allow shared users to manage items
DROP POLICY IF EXISTS "Users can manage items in their lists" ON list_items;
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
CREATE INDEX idx_shared_lists_list_id ON shared_lists(list_id);
CREATE INDEX idx_shared_lists_shared_with ON shared_lists(shared_with);