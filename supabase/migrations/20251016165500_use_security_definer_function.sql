/*
  # Use SECURITY DEFINER function to bypass RLS in policy checks

  1. Problem
    - WITH CHECK clause fails because it queries organizers table
    - organizers RLS policies block the subquery
    - This creates a catch-22 situation

  2. Solution
    - Create a SECURITY DEFINER function that bypasses RLS
    - This function checks if user owns an organizer
    - Use this function in the policy instead of direct subquery

  3. Security
    - Function only returns true/false, no data leak
    - Still validates ownership correctly
    - Bypasses RLS recursion issue
*/

-- Create a function that checks if user owns an organizer (bypasses RLS)
CREATE OR REPLACE FUNCTION user_owns_organizer(organizer_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizers
    WHERE id = organizer_uuid
    AND user_id = user_uuid
  );
$$;

-- Drop existing policy
DROP POLICY IF EXISTS "Organizers can update own events" ON events;

-- Create new policy using the SECURITY DEFINER function
CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    user_owns_organizer(organizer_id, auth.uid())
  )
  WITH CHECK (
    user_owns_organizer(organizer_id, auth.uid())
  );
