/*
  # Remove old admin policies that don't work with admin_users table

  1. Actions
    - Drop all admin policies that use is_admin() function
    - Drop is_admin() function
*/

-- Drop all admin policies
DROP POLICY IF EXISTS "Admins can view all events" ON events;
DROP POLICY IF EXISTS "Admins can update all events" ON events;
DROP POLICY IF EXISTS "Admins can delete all events" ON events;

DROP POLICY IF EXISTS "Admins can view all organizers" ON organizers;
DROP POLICY IF EXISTS "Admins can update all organizers" ON organizers;
DROP POLICY IF EXISTS "Admins can delete organizers" ON organizers;

DROP POLICY IF EXISTS "Admins can view all registrations" ON registrations;
DROP POLICY IF EXISTS "Admins can update all registrations" ON registrations;
DROP POLICY IF EXISTS "Admins can delete registrations" ON registrations;

DROP POLICY IF EXISTS "Admins can view all races" ON races;
DROP POLICY IF EXISTS "Admins can update all races" ON races;
DROP POLICY IF EXISTS "Admins can delete races" ON races;

DROP POLICY IF EXISTS "Admins can view all athletes" ON athletes;
DROP POLICY IF EXISTS "Admins can update all athletes" ON athletes;

DROP POLICY IF EXISTS "Admins can view all entries" ON entries;
DROP POLICY IF EXISTS "Admins can update all entries" ON entries;
DROP POLICY IF EXISTS "Admins can delete entries" ON entries;

-- Now drop the function
DROP FUNCTION IF EXISTS is_admin();
