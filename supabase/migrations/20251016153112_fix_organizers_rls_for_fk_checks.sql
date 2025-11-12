/*
  # Fix organizers RLS for foreign key checks
  
  1. Problem
    - When updating events, PostgreSQL checks the FK constraint organizer_id -> organizers.id
    - But RLS on organizers prevents this check from working
    - This causes "new row violates row-level security policy"
    
  2. Solution
    - Add a policy that allows reading organizer records for FK validation
    - This doesn't expose data, just allows the FK constraint to work
    
  3. Security
    - Still maintains proper access control
    - Only allows checking if organizer exists (for FK purposes)
*/

-- Add a policy to allow FK checks to work
-- This allows authenticated users to verify that an organizer_id exists
-- which is necessary for foreign key constraint validation
CREATE POLICY "Allow FK validation for organizers"
  ON organizers FOR SELECT
  TO authenticated
  USING (
    -- Allow reading organizer record if:
    -- 1. It's your own organizer
    auth.uid() = user_id
    -- 2. OR it's needed for FK validation (checking if id exists)
    -- We check if the organizer is referenced by an event the user owns
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.organizer_id = organizers.id
      AND EXISTS (
        SELECT 1 FROM organizers AS user_org
        WHERE user_org.id = events.organizer_id
        AND user_org.user_id = auth.uid()
      )
    )
  );

-- Clean up duplicate policies
DROP POLICY IF EXISTS "Organizers can read own data" ON organizers;
DROP POLICY IF EXISTS "Organizers can view own profile" ON organizers;

-- Recreate simpler, non-overlapping policies
CREATE POLICY "Organizers can view own profile"
  ON organizers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
