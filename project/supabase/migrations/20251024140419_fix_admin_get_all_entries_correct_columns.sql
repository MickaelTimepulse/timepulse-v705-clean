/*
  # Fix admin_get_all_entries function - correct athlete column names

  1. Corrections
    - phone_mobile -> phone
    - nationality_code -> country_code
    - license_number -> license_id
    - club -> license_club
*/

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
    a.phone as phone_mobile,
    a.country_code as nationality_code,
    a.license_id as license_number,
    a.license_club as club,
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
