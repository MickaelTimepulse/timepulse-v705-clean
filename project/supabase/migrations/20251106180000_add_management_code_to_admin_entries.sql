/*
  # Add management code and organizer to admin_get_all_entries function

  1. Changes
    - Add management_code to the return type
    - Add event_organizer_id to the return type
    - Update SELECT to include these new fields

  2. Purpose
    - Enable admin to resend confirmation emails with all necessary data
*/

DROP FUNCTION IF EXISTS admin_get_all_entries();

CREATE OR REPLACE FUNCTION admin_get_all_entries()
RETURNS TABLE (
  id uuid,
  race_id uuid,
  event_id uuid,
  event_organizer_id uuid,
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
  license_type text,
  club text,
  category text,
  status text,
  amount numeric,
  paid_at timestamptz,
  refund_status text,
  refund_amount numeric,
  management_code text,
  pps_number text,
  pps_expiry_date date,
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
    ev.organizer_id as event_organizer_id,
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
    e.license_type::text,
    a.license_club::text as club,
    ''::text as category,
    e.status::text,
    e.amount,
    e.paid_at,
    e.refund_status::text,
    e.refund_amount,
    e.management_code::text,
    e.pps_number::text,
    e.pps_expiry_date,
    e.created_at
  FROM entries e
  JOIN races r ON r.id = e.race_id
  JOIN events ev ON ev.id = r.event_id
  JOIN athletes a ON a.id = e.athlete_id
  ORDER BY e.created_at DESC;
END;
$$;

COMMENT ON FUNCTION admin_get_all_entries IS 'Returns all entries for admin panel with event, race, athlete details, and management codes';
