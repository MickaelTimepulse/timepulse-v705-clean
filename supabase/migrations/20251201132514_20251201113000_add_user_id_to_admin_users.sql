/*
  # Add user_id column to admin_users

  1. Changes
    - Add user_id column to link admin_users to Supabase Auth users
    - This enables RLS policies to identify admins via auth.uid()

  2. Security
    - user_id stores the Supabase Auth user ID
    - Updated during login in src/lib/auth.ts
*/

-- Add user_id column to admin_users
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Add comment
COMMENT ON COLUMN admin_users.user_id IS 'Supabase Auth user ID, set during login';
