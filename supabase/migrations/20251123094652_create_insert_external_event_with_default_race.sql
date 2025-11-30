/*
  # Fonction d'insertion d'événement externe avec race automatique

  1. Fonctionnalité
    - Insère un événement externe en statut draft
    - Crée automatiquement une race "Course principale"
    - Retourne l'ID de l'événement et l'ID de la race
    
  2. Sécurité
    - SECURITY DEFINER pour contourner RLS
    - Force status='draft' et is_public=false pour validation admin
*/

CREATE FUNCTION public.insert_external_event_public(
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
  p_custom_fields jsonb DEFAULT '{}'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_race_id uuid;
BEGIN
  -- Insérer l'événement en mode draft (non public)
  INSERT INTO external_events (
    name, slug, event_date, city, country_code, organizer_name,
    organizer_email, description, sport_type, distance_km,
    organizer_phone, organizer_website, custom_fields,
    status, is_public, created_at, updated_at
  )
  VALUES (
    p_name, p_slug, p_event_date, p_city, p_country_code, p_organizer_name,
    p_organizer_email, p_description, p_sport_type, p_distance_km,
    p_organizer_phone, p_organizer_website, p_custom_fields,
    'draft', false, now(), now()
  )
  RETURNING id INTO v_event_id;
  
  -- Créer automatiquement une race par défaut
  INSERT INTO external_races (
    external_event_id,
    name,
    distance_km,
    sport_type,
    created_at,
    updated_at
  )
  VALUES (
    v_event_id,
    'Course principale',
    p_distance_km,
    p_sport_type,
    now(),
    now()
  )
  RETURNING id INTO v_race_id;
  
  RETURN jsonb_build_object(
    'id', v_event_id,
    'race_id', v_race_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_external_event_public TO anon, authenticated;

COMMENT ON FUNCTION public.insert_external_event_public IS 
'Permet la soumission publique d''événements externes. Crée automatiquement une race par défaut.';
