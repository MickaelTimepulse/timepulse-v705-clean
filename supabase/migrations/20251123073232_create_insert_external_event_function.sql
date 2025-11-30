/*
  # Fonction pour insertion publique d'événements externes

  1. Problème
    - Les policies RLS bloquent les insertions anonymes directes
    - Besoin d'une solution contournant RLS pour les soumissions publiques
    
  2. Solution
    - Crée une fonction SECURITY DEFINER qui bypass RLS
    - Permet aux utilisateurs anonymes de soumettre des événements
    - Force status='draft' et is_public=false pour sécurité
*/

CREATE OR REPLACE FUNCTION public.insert_external_event_public(
  p_name text,
  p_slug text,
  p_event_date date,
  p_city text,
  p_country_code text,
  p_organizer_name text,
  p_organizer_email text,
  p_description text DEFAULT '',
  p_sport_type text DEFAULT 'running',
  p_distance_km numeric DEFAULT NULL,
  p_organizer_phone text DEFAULT NULL,
  p_organizer_website text DEFAULT NULL,
  p_custom_fields jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_result jsonb;
BEGIN
  -- Insertion avec status='draft' et is_public=false forcés
  INSERT INTO external_events (
    name, slug, event_date, city, country_code, 
    organizer_name, organizer_email, description,
    sport_type, distance_km, organizer_phone, 
    organizer_website, status, is_public, custom_fields
  ) VALUES (
    p_name, p_slug, p_event_date, p_city, p_country_code,
    p_organizer_name, p_organizer_email, p_description,
    p_sport_type, p_distance_km, p_organizer_phone,
    p_organizer_website, 'draft', false, p_custom_fields
  )
  RETURNING id INTO v_event_id;
  
  -- Retourne les infos de l'événement créé
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'slug', slug,
    'status', status,
    'is_public', is_public
  ) INTO v_result
  FROM external_events
  WHERE id = v_event_id;
  
  RETURN v_result;
END;
$$;

-- Permissions pour anon et authenticated
GRANT EXECUTE ON FUNCTION public.insert_external_event_public TO anon, authenticated;

COMMENT ON FUNCTION public.insert_external_event_public IS 
'Permet la soumission publique d''événements externes. Force status=draft et is_public=false pour sécurité.';
