/*
  # Fonction pour récupérer tous les événements externes (admin)

  1. Fonction
    - Permet aux admins de récupérer tous les événements externes
    - Contourne RLS avec SECURITY DEFINER
    - Vérifie que l'utilisateur est bien admin
    
  2. Sécurité
    - Vérifie l'authentification
    - Vérifie que l'utilisateur est dans admin_users
*/

CREATE OR REPLACE FUNCTION public.admin_get_external_events()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  event_date date,
  registration_deadline date,
  city text,
  country_code text,
  postal_code text,
  sport_type text,
  distance_km numeric,
  elevation_gain_m integer,
  organizer_name text,
  organizer_email text,
  organizer_phone text,
  organizer_website text,
  organizer_id uuid,
  logo_url text,
  banner_url text,
  banner_position jsonb,
  status text,
  is_public boolean,
  total_participants integer,
  total_finishers integer,
  results_imported_at timestamptz,
  results_source text,
  results_url text,
  timing_provider text,
  custom_fields jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  created_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = auth.uid() 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  
  -- Retourner tous les événements externes
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.slug,
    e.description,
    e.event_date,
    e.registration_deadline,
    e.city,
    e.country_code,
    e.postal_code,
    e.sport_type,
    e.distance_km,
    e.elevation_gain_m,
    e.organizer_name,
    e.organizer_email,
    e.organizer_phone,
    e.organizer_website,
    e.organizer_id,
    e.logo_url,
    e.banner_url,
    e.banner_position,
    e.status,
    e.is_public,
    e.total_participants,
    e.total_finishers,
    e.results_imported_at,
    e.results_source,
    e.results_url,
    e.timing_provider,
    e.custom_fields,
    e.created_at,
    e.updated_at,
    e.created_by
  FROM external_events e
  ORDER BY e.event_date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_external_events TO authenticated;

COMMENT ON FUNCTION public.admin_get_external_events IS 
'Permet aux admins de récupérer tous les événements externes sans restriction RLS';
