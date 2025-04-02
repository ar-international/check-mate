/*
  # Simple Lists Schema

  1. New Tables
    - `lists`: Store user lists
      - `id` (uuid, primary key)
      - `title` (text)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
    
    - `list_items`: Store items within lists
      - `id` (uuid, primary key)
      - `list_id` (uuid, references lists)
      - `content` (text)
      - `completed` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Simple policies for user data access
*/

-- Drop existing tables
DROP TABLE IF EXISTS list_items CASCADE;
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

-- Enable Row Level Security
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- Lists policies
CREATE POLICY "Users can manage their own lists"
  ON lists
  TO authenticated
  USING (user_id = auth.uid());

-- List items policies
CREATE POLICY "Users can manage items in their lists"
  ON list_items
  TO authenticated
  USING (
    list_id IN (
      SELECT id FROM lists WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_list_items_list_id ON list_items(list_id);