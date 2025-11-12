/*
  # Fix Security Issues - Part 2: Enable RLS on Critical Tables

  1. Security Enhancement
    - Enable RLS on tables with policies but RLS disabled
    - Enable RLS on public tables
    - Add policies for admin_activity_logs and related tables

  2. Tables to fix
    - athletes (has policies, RLS disabled)
    - entries (has policies, RLS disabled, public table)
    - entry_payments (has policies, RLS disabled, public table)
    - admin_activity_logs (RLS enabled, no policies)
    - admin_login_sessions (RLS enabled, no policies)
    - admin_permissions (RLS enabled, no policies)
    - admin_roles (RLS enabled, no policies)
    - admin_user_permissions (RLS enabled, no policies)
*/

-- Enable RLS on tables that have policies but RLS is disabled
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_payments ENABLE ROW LEVEL SECURITY;

-- Add policies for admin tables that have RLS but no policies

-- admin_activity_logs policies
CREATE POLICY "Admins can read all activity logs"
  ON admin_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    )
  );

-- admin_login_sessions policies
CREATE POLICY "Admins can read own login sessions"
  ON admin_login_sessions
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM admin_users 
      WHERE email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    )
  );

-- admin_permissions policies
CREATE POLICY "Admins can read permissions"
  ON admin_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    )
  );

-- admin_roles policies
CREATE POLICY "Admins can read roles"
  ON admin_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    )
  );

-- admin_user_permissions policies
CREATE POLICY "Admins can read user permissions"
  ON admin_user_permissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    )
  );
