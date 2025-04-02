/*
  # Fix Lists Table Policies

  1. Changes
    - Drop existing policies on lists table
    - Create new, clearer policies for list access
    
  2. Security
    - Users can manage their own lists
    - Users can view lists shared with them
    - Ensure proper access control for both owners and shared users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own lists" ON lists;
DROP POLICY IF EXISTS "Users can view shared lists" ON lists;
DROP POLICY IF EXISTS "Users can view their shared lists" ON lists;

-- Create new policies
CREATE POLICY "Users can manage their own lists"
  ON lists
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view shared lists"
  ON lists
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM shared_lists
      WHERE shared_lists.list_id = lists.id
      AND shared_lists.shared_with = auth.uid()
    )
  );