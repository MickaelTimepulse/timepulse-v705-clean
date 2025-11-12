/*
  # Create Admin Query Functions

  1. Purpose
    - Admin users authenticate via admin_users table (not Supabase Auth)
    - Admin pages need to bypass RLS to view all data
    - Create SECURITY DEFINER functions that bypass RLS
  
  2. Functions Created
    - admin_get_all_events: Get all events regardless of RLS
    - admin_get_all_organizers: Get all organizers with event counts
    - admin_get_all_registrations: Get all registrations with details
    - admin_get_dashboard_stats: Get dashboard statistics
  
  3. Security
    - Functions are SECURITY DEFINER (run as function owner, bypass RLS)
    - No auth check in functions (we trust the frontend auth layer)
*/

-- Function to get all events for admin
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
    COUNT(r.id) as registration_count
  FROM events e
  LEFT JOIN organizers o ON e.organizer_id = o.id
  LEFT JOIN races ra ON ra.event_id = e.id
  LEFT JOIN registrations r ON r.race_id = ra.id
  GROUP BY e.id, o.organization_name
  ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all organizers for admin
CREATE OR REPLACE FUNCTION admin_get_all_organizers()
RETURNS TABLE (
  id uuid,
  organization_name text,
  email text,
  mobile_phone text,
  contact_name text,
  organization_type text,
  status text,
  created_at timestamptz,
  event_count bigint
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.organization_name,
    o.email,
    o.mobile_phone,
    o.contact_name,
    o.organization_type,
    o.status,
    o.created_at,
    COUNT(e.id) as event_count
  FROM organizers o
  LEFT JOIN events e ON e.organizer_id = o.id
  GROUP BY o.id
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get all registrations for admin
CREATE OR REPLACE FUNCTION admin_get_all_registrations()
RETURNS TABLE (
  id uuid,
  race_id uuid,
  bib_number integer,
  first_name text,
  last_name text,
  email text,
  payment_status text,
  status text,
  price_paid numeric,
  created_at timestamptz,
  event_name text,
  event_city text,
  race_name text,
  category_label text,
  athlete_first_name text,
  athlete_last_name text,
  athlete_email text,
  athlete_phone_mobile text,
  athlete_gender text,
  athlete_birth_date date,
  athlete_nationality_code text,
  athlete_license_number text,
  athlete_club text
) SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.race_id,
    r.bib_number,
    r.first_name,
    r.last_name,
    r.email,
    r.payment_status,
    r.status,
    r.price_paid,
    r.created_at,
    e.name as event_name,
    e.city as event_city,
    ra.name as race_name,
    rc.label as category_label,
    a.first_name as athlete_first_name,
    a.last_name as athlete_last_name,
    a.email as athlete_email,
    a.phone_mobile as athlete_phone_mobile,
    a.gender as athlete_gender,
    a.birth_date as athlete_birth_date,
    a.nationality_code as athlete_nationality_code,
    a.license_number as athlete_license_number,
    a.club as athlete_club
  FROM registrations r
  LEFT JOIN races ra ON r.race_id = ra.id
  LEFT JOIN events e ON ra.event_id = e.id
  LEFT JOIN race_categories rc ON r.category_id = rc.id
  LEFT JOIN athletes a ON r.first_name = a.first_name AND r.last_name = a.last_name AND r.email = a.email
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get dashboard statistics
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
    'registrations', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM registrations),
      'confirmed', (SELECT COUNT(*) FROM registrations WHERE payment_status = 'confirmed'),
      'pending', (SELECT COUNT(*) FROM registrations WHERE payment_status = 'pending'),
      'cancelled', (SELECT COUNT(*) FROM registrations WHERE payment_status = 'cancelled')
    ),
    'revenue', jsonb_build_object(
      'total', (SELECT COALESCE(SUM(price_paid), 0) FROM registrations WHERE payment_status = 'confirmed'),
      'thisMonth', (
        SELECT COALESCE(SUM(price_paid), 0) 
        FROM registrations 
        WHERE payment_status = 'confirmed' 
        AND created_at >= date_trunc('month', CURRENT_DATE)
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
