/*
  # Update Admin Functions to use Entries Table

  1. Changes
    - Replace admin_get_all_registrations to use entries table instead of registrations
    - Update admin_get_dashboard_stats to count from entries table
    - Update admin_get_all_events to count from entries table
  
  2. Reason
    - The entries table contains all inscriptions (11 total)
    - The registrations table is old/deprecated (5 test records)
    - Admin should see all entries from the entries table
*/

-- Drop old function
DROP FUNCTION IF EXISTS admin_get_all_registrations();

-- Create new function to get all entries (replaces registrations)
CREATE OR REPLACE FUNCTION admin_get_all_entries()
RETURNS TABLE (
  id uuid,
  athlete_id uuid,
  race_id uuid,
  event_id uuid,
  bib_number integer,
  source varchar,
  status varchar,
  created_at timestamptz,
  first_name text,
  last_name text,
  email text,
  gender text,
  birthdate date,
  phone_mobile text,
  nationality_code text,
  license_number text,
  club text,
  race_name text,
  event_name text,
  event_city text,
  category varchar
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.athlete_id,
    e.race_id,
    e.event_id,
    e.bib_number,
    e.source,
    e.status,
    e.created_at,
    a.first_name,
    a.last_name,
    a.email,
    a.gender,
    a.birthdate,
    a.phone_mobile,
    a.nationality_code,
    a.license_number,
    a.club,
    r.name as race_name,
    ev.name as event_name,
    ev.city as event_city,
    e.category
  FROM entries e
  LEFT JOIN athletes a ON e.athlete_id = a.id
  LEFT JOIN races r ON e.race_id = r.id
  LEFT JOIN events ev ON e.event_id = ev.id
  ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update dashboard stats to use entries
CREATE OR REPLACE FUNCTION admin_get_dashboard_stats()
RETURNS jsonb SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'events', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM events),
      'published', (SELECT COUNT(*) FROM events WHERE status = 'published'),
      'draft', (SELECT COUNT(*) FROM events WHERE status = 'draft')
    ),
    'organizers', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM organizers),
      'active', (SELECT COUNT(*) FROM organizers WHERE status = 'active')
    ),
    'entries', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM entries),
      'confirmed', (SELECT COUNT(*) FROM entries WHERE status = 'confirmed'),
      'pending', (SELECT COUNT(*) FROM entries WHERE status = 'pending'),
      'cancelled', (SELECT COUNT(*) FROM entries WHERE status = 'cancelled')
    ),
    'revenue', jsonb_build_object(
      'total', 0,
      'thisMonth', 0
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update events function to count from entries
CREATE OR REPLACE FUNCTION admin_get_all_events()
RETURNS TABLE (
  id uuid,
  organizer_id uuid,
  name text,
  slug text,
  description text,
  city text,
  start_date date,
  status text,
  created_at timestamptz,
  organizer_name text,
  registration_count bigint
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.organizer_id,
    e.name,
    e.slug,
    e.description,
    e.city,
    e.start_date,
    e.status,
    e.created_at,
    o.organization_name as organizer_name,
    COUNT(ent.id) as registration_count
  FROM events e
  LEFT JOIN organizers o ON e.organizer_id = o.id
  LEFT JOIN entries ent ON ent.event_id = e.id
  GROUP BY e.id, o.organization_name
  ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql;
