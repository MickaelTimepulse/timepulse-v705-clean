/*
  # Fix admin_get_all_entries function - cast all varchar to text

  1. Problem
    - Function returns text but columns are varchar with specific lengths
    - PostgreSQL strict type checking causes mismatch error

  2. Solution
    - Cast all varchar columns to text explicitly using ::text
*/

-- Drop and recreate the function with proper type casting
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
    ev.name::text as event_name,
    ev.city::text as event_city,
    r.name::text as race_name,
    e.bib_number,
    a.first_name::text,
    a.last_name::text,
    a.gender::text,
    a.birthdate,
    a.email::text,
    a.phone::text as phone_mobile,
    a.nationality::text as nationality_code,
    a.license_id::text as license_number,
    a.license_club::text as club,
    ''::text as category,
    e.status::text,
    e.amount,
    e.paid_at,
    e.refund_status::text,
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
