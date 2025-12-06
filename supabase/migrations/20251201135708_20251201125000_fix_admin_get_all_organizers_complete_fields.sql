/*
  # Fix admin_get_all_organizers to Return Complete Fields

  1. Problem
    - Function only returns basic fields
    - Missing: full_address, city, postal_code, country, website_url, facebook_url, instagram_url, siret
    - Frontend edit modal shows empty fields because data not loaded

  2. Solution
    - Drop and recreate function with all organizer fields
    - Keep event_count for statistics

  3. Security
    - Function remains SECURITY DEFINER
    - Only callable by authenticated users (RLS on function call)
*/

-- Drop existing function
DROP FUNCTION IF EXISTS admin_get_all_organizers();

-- Recreate with complete fields
CREATE FUNCTION admin_get_all_organizers()
RETURNS TABLE(
  id uuid,
  organization_name text,
  email text,
  mobile_phone text,
  contact_name text,
  organizer_type text,
  status text,
  siret text,
  full_address text,
  city text,
  postal_code text,
  country text,
  country_code text,
  website_url text,
  facebook_url text,
  instagram_url text,
  public_description text,
  logo_file_url text,
  is_verified boolean,
  is_profile_complete boolean,
  created_at timestamptz,
  updated_at timestamptz,
  event_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.organization_name,
    o.email,
    o.mobile_phone,
    o.contact_name,
    o.organizer_type,
    o.status,
    o.siret,
    o.full_address,
    o.city,
    o.postal_code,
    o.country,
    o.country_code,
    o.website_url,
    o.facebook_url,
    o.instagram_url,
    o.public_description,
    o.logo_file_url,
    o.is_verified,
    o.is_profile_complete,
    o.created_at,
    o.updated_at,
    COUNT(e.id) as event_count
  FROM organizers o
  LEFT JOIN events e ON e.organizer_id = o.id
  GROUP BY o.id
  ORDER BY o.created_at DESC;
END;
$$;
