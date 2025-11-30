/*
  # Fix admin_get_all_entries function - birthdate column name

  1. Problem
    - Function uses `a.birth_date` but column is named `birthdate`
    - This causes error when loading entries in admin

  2. Solution
    - Fix column reference to use `birthdate` instead of `birth_date`
*/

-- Drop and recreate the function with correct column name
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
    a.phone_mobile,
    a.nationality_code,
    a.license_number,
    a.club,
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
