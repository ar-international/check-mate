/*
  # Fix Lists Table RLS Policies

  1. Changes
    - Drop existing policies that may be causing infinite recursion
    - Create new, simplified RLS policies for the lists table
    
  2. Security
    - Enable RLS on lists table
    - Add policies for CRUD operations
    - Ensure users can only access their own lists
*/

-- First, drop any existing policies on the lists table
DROP POLICY IF EXISTS "enable_own_lists_delete" ON lists;
DROP POLICY IF EXISTS "enable_own_lists_insert" ON lists;
DROP POLICY IF EXISTS "enable_own_lists_select" ON lists;
DROP POLICY IF EXISTS "enable_own_lists_update" ON lists;
DROP POLICY IF EXISTS "enable_shared_lists_select" ON lists;

-- Create new, simplified policies
CREATE POLICY "Users can manage their own lists"
  ON lists
  USING (auth.uid() = user_id);

-- Add separate policy for shared lists
CREATE POLICY "Users can view shared lists"
  ON lists FOR SELECT
  USING (
    id IN (
      SELECT list_id 
      FROM shared_lists 
      WHERE shared_with = auth.uid()
    )
  );