/*
  # Fix Shared Lists Policies

  1. Changes
    - Drop existing policies on shared_lists table
    - Create new, non-recursive policies
    
  2. Security
    - Allow users to share their own lists
    - Allow users to see lists shared with them
    - Prevent infinite recursion in policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can share their own lists" ON shared_lists;
DROP POLICY IF EXISTS "Users can view their shared lists" ON shared_lists;

-- Create new policies
CREATE POLICY "Enable insert for list owners"
  ON shared_lists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable select for involved users"
  ON shared_lists
  FOR SELECT
  TO authenticated
  USING (
    shared_with = auth.uid() OR
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable delete for list owners"
  ON shared_lists
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_id
      AND lists.user_id = auth.uid()
    )
  );