/*
  # Create backups table for tracking system backups

  1. New Tables
    - `backups`
      - `id` (uuid, primary key)
      - `backup_type` (text) - Type: full, migrations, tables, etc.
      - `status` (text) - Status: success, failed, in_progress
      - `file_path` (text) - Path to the backup file
      - `file_size` (bigint) - Size in bytes
      - `tables_included` (jsonb) - List of tables included
      - `metadata` (jsonb) - Additional metadata
      - `error_message` (text) - Error details if failed
      - `created_at` (timestamptz)
      - `created_by` (uuid) - Reference to admin_users
  
  2. Security
    - Enable RLS on `backups` table
    - Only super_admin can view and manage backups
*/

CREATE TABLE IF NOT EXISTS backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  file_path text,
  file_size bigint,
  tables_included jsonb,
  metadata jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_users(id)
);

-- Enable RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view backups
CREATE POLICY "Super admins can view backups"
  ON backups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Only super_admin can create backups
CREATE POLICY "Super admins can create backups"
  ON backups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Only super_admin can update backups
CREATE POLICY "Super admins can update backups"
  ON backups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Only super_admin can delete backups
CREATE POLICY "Super admins can delete backups"
  ON backups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status);