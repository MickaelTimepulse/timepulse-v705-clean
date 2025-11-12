/*
  # Create Admin Users & Authentication System

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `hashed_password` (text)
      - `name` (text)
      - `role` (text) - super_admin, staff, organizer
      - `org_id` (uuid, nullable) - for organizers
      - `is_active` (boolean)
      - `last_login_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `admin_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `token` (text, unique)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated access
    - Hash passwords using pgcrypto

  3. Initial Data
    - Create super admin user (mickael@timepulse.fr)
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  hashed_password text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'organizer',
  org_id uuid,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users (allow service role full access)
CREATE POLICY "Service role full access to admin_users"
  ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can read for login"
  ON admin_users
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for admin_sessions (allow service role full access)
CREATE POLICY "Service role full access to admin_sessions"
  ON admin_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert super admin user
-- Password: Timepulse2025@!
INSERT INTO admin_users (email, hashed_password, name, role, is_active)
VALUES (
  'mickael@timepulse.fr',
  crypt('Timepulse2025@!', gen_salt('bf')),
  'Mickael',
  'super_admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Function to verify password
CREATE OR REPLACE FUNCTION verify_admin_password(
  p_email text,
  p_password text
)
RETURNS TABLE(
  user_id uuid,
  user_email text,
  user_name text,
  user_role text,
  org_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.name,
    au.role,
    au.org_id
  FROM admin_users au
  WHERE au.email = p_email
    AND au.hashed_password = crypt(p_password, au.hashed_password)
    AND au.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last login
CREATE OR REPLACE FUNCTION update_last_login(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE admin_users
  SET last_login_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;