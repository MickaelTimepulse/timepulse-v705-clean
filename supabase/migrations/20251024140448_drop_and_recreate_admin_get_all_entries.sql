/*
  # Drop and recreate admin_get_all_entries with correct types

  1. Actions
    - Drop existing function
    - Recreate with proper type casting
*/

DROP FUNCTION IF EXISTS admin_get_all_entries();

CREATE FUNCTION admin_get_all_entries()
RETURNS TABLE (
  id uuid,
  athlete_id uuid,
  race_id uuid,
  event_id uuid,
  bib_number integer,
  source text,
  status text,
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
  category text
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
    e.source::text,
    e.status::text,
    e.created_at,
    a.first_name::text,
    a.last_name::text,
    a.email::text,
    a.gender::text,
    a.birthdate,
    a.phone::text,
    a.country_code::text,
    a.license_id::text,
    a.license_club::text,
    r.name::text,
    ev.name::text,
    ev.city::text,
    e.category::text
  FROM entries e
  LEFT JOIN athletes a ON e.athlete_id = a.id
  LEFT JOIN races r ON e.race_id = r.id
  LEFT JOIN events ev ON e.event_id = ev.id
  ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql;
