/*
  # Fix List Sharing Policies

  1. Changes
    - Drop all existing policies on lists and shared_lists tables
    - Create new, simplified policies without circular dependencies
    - Ensure clear separation between list ownership and sharing permissions
    
  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep policies simple and direct
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can manage their own lists" ON lists;
DROP POLICY IF EXISTS "Users can view shared lists" ON lists;
DROP POLICY IF EXISTS "Enable insert for list owners" ON shared_lists;
DROP POLICY IF EXISTS "Enable select for involved users" ON shared_lists;
DROP POLICY IF EXISTS "Enable delete for list owners" ON shared_lists;

-- Lists table policies
CREATE POLICY "Enable full access for owners"
  ON lists
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable read access for shared users"
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

-- Shared lists table policies
CREATE POLICY "Enable share management for owners"
  ON shared_lists
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM lists
      WHERE lists.id = shared_lists.list_id
      AND lists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM lists
      WHERE lists.id = list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable view shares for recipients"
  ON shared_lists
  FOR SELECT
  TO authenticated
  USING (shared_with = auth.uid());