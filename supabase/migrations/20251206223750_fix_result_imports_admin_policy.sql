/*
  # Fix Result Imports Policies

  1. Changes
    - Add admin policy for result_imports INSERT
    - Add admin policy for result_imports UPDATE

  2. Security
    - Admins can create and update any import
    - Organizers can only create imports for their own events
*/

-- Allow admins to insert result imports
CREATE POLICY "Admins can insert result imports"
  ON result_imports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

-- Allow admins to update result imports
CREATE POLICY "Admins can update result imports"
  ON result_imports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );
