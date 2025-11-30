/*
  # Fix admin_get_all_entries function - correct all column names

  1. Problem
    - Function uses wrong column names from athletes table
    - phone_mobile → phone
    - license_number → license_id
    - nationality_code → nationality
    - club → license_club

  2. Solution
    - Update all column references to match actual table structure
*/

-- Drop and recreate the function with correct column names
DROP FUNCTION IF EXISTS admin_get_all_entries();

CREATE OR REPLACE FUNCTION admin_get_all_entries()
RETURNS TABLE (
  id uuid,
  race_id uuid,
  event_id uuid,
  event_name text,
  event_city text,
  race_name text,
  bib_number integer,
  first_name text,
  last_name text,
  gender text,
  birthdate date,
  email text,
  phone_mobile text,
  nationality_code text,
  license_number text,
  club text,
  category text,
  status text,
  amount numeric,
  paid_at timestamptz,
  refund_status text,
  refund_amount numeric,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.race_id,
    ev.id as event_id,
    ev.name as event_name,
    ev.city as event_city,
    r.name as race_name,
    e.bib_number,
    a.first_name,
    a.last_name,
    a.gender,
    a.birthdate,
    a.email,
    a.phone as phone_mobile,
    a.nationality as nationality_code,
    a.license_id as license_number,
    a.license_club as club,
    '' as category,
    e.status,
    e.amount,
    e.paid_at,
    e.refund_status,
    e.refund_amount,
    e.created_at
  FROM entries e
  JOIN races r ON r.id = e.race_id
  JOIN events ev ON ev.id = r.event_id
  JOIN athletes a ON a.id = e.athlete_id
  ORDER BY e.created_at DESC;
END;
$$;

COMMENT ON FUNCTION admin_get_all_entries IS 'Returns all entries for admin panel with event, race, and athlete details';
