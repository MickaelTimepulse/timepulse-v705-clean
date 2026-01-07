/*
  # Fix Relay Segments RLS for Admins
  
  1. Problem
    - Admin policy was missing WITH CHECK clause
    - This prevented INSERT/UPDATE operations by admins
  
  2. Solution
    - Add WITH CHECK to admin policy
    - Now admins can create, read, update and delete relay segments
*/

DROP POLICY IF EXISTS "Admins can manage all relay segments" ON relay_segments;

CREATE POLICY "Admins can manage all relay segments"
  ON relay_segments FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );