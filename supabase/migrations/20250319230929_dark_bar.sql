/*
  # Fix ambiguous column references in get_shared_users function

  1. Changes
    - Drop existing function
    - Recreate with explicit table aliases for all column references
    
  2. Security
    - Maintain SECURITY DEFINER setting
    - Keep existing permission checks
*/

-- Drop the existing function first
DROP FUNCTION IF EXISTS get_shared_users(UUID);

-- Recreate the function with explicit table aliases
CREATE FUNCTION get_shared_users(list_id_input UUID)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user has permission to view this list's shared users
  IF NOT EXISTS (
    SELECT 1 FROM lists l
    WHERE l.id = list_id_input
    AND l.user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    au.id AS user_id,
    au.email AS user_email
  FROM auth.users au
  INNER JOIN shared_lists sl ON sl.shared_with = au.id
  WHERE sl.list_id = list_id_input;
END;
$$;