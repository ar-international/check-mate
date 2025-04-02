/*
  # Revert Policy Changes

  1. Changes
    - Drop all policies created in the problematic migrations
    - Restore the original working policies from previous migrations
    
  2. Security
    - Maintain proper access control
    - Keep policies simple and direct
*/

-- Drop all policies from recent migrations
DROP POLICY IF EXISTS "Users can manage their own lists" ON lists;
DROP POLICY IF EXISTS "Users can view shared lists" ON lists;
DROP POLICY IF EXISTS "Enable full access for owners" ON lists;
DROP POLICY IF EXISTS "Enable read access for shared users" ON lists;
DROP POLICY IF EXISTS "Enable insert for list owners" ON shared_lists;
DROP POLICY IF EXISTS "Enable select for involved users" ON shared_lists;
DROP POLICY IF EXISTS "Enable delete for list owners" ON shared_lists;
DROP POLICY IF EXISTS "Enable share management for owners" ON shared_lists;
DROP POLICY IF EXISTS "Enable view shares for recipients" ON shared_lists;

-- Restore original working policies for lists
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

-- Restore original working policies for shared_lists
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