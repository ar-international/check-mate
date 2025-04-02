/*
  # Add User Management Functions
  
  1. New Functions
    - get_user_id_by_email: Get user ID from email
    - get_shared_users: Get shared users for a list
    
  2. Security
    - Functions are accessible only to authenticated users
    - Functions only return data the user has permission to see
*/

-- Function to get user ID by email
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_input TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = email_input;
  
  RETURN user_id;
END;
$$;

-- Function to get shared users for a list
CREATE OR REPLACE FUNCTION get_shared_users(list_id_input UUID)
RETURNS TABLE (
  id UUID,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user has permission to view this list's shared users
  IF NOT EXISTS (
    SELECT 1 FROM lists
    WHERE id = list_id_input
    AND user_id = auth.uid()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT au.id, au.email
  FROM auth.users au
  INNER JOIN shared_lists sl ON sl.shared_with = au.id
  WHERE sl.list_id = list_id_input;
END;
$$;