/*
  # Fix Admin Update Policy for Organizers

  1. Problem
    - Admin update policy has WITH CHECK null
    - This prevents actual updates from being saved
    - Only USING clause is not enough for UPDATE policies

  2. Solution
    - Drop and recreate with proper WITH CHECK clause
    - Use is_admin_by_email() as fallback

  3. Security
    - Only active admins can update organizers
*/

-- Drop existing admin update policy
DROP POLICY IF EXISTS "Supabase Auth admins can update all organizers" ON organizers;

-- Recreate with proper WITH CHECK
CREATE POLICY "Admins can update all organizers"
  ON organizers FOR UPDATE
  TO authenticated
  USING (is_supabase_admin() OR is_admin_by_email())
  WITH CHECK (is_supabase_admin() OR is_admin_by_email());
