/*
  # Fonction pour récupérer les résultats d'un événement externe (admin)

  1. Fonction
    - Permet aux admins de récupérer tous les résultats d'un événement
    - Contourne RLS avec SECURITY DEFINER
    
  2. Sécurité
    - Vérifie que l'utilisateur est admin
*/

CREATE OR REPLACE FUNCTION public.admin_get_external_results(p_event_id uuid)
RETURNS TABLE (
  id uuid,
  external_event_id uuid,
  external_race_id uuid,
  bib_number text,
  first_name text,
  last_name text,
  gender text,
  birth_year integer,
  birth_date date,
  city text,
  club text,
  category text,
  finish_time interval,
  finish_time_display text,
  overall_rank integer,
  gender_rank integer,
  category_rank integer,
  status text,
  athlete_id uuid,
  is_matched boolean,
  matching_confidence numeric,
  custom_fields jsonb,
  created_at timestamptz,
  updated_at timestamptz
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
  
  -- Retourner tous les résultats de l'événement
  RETURN QUERY
  SELECT 
    r.id,
    r.external_event_id,
    r.external_race_id,
    r.bib_number,
    r.first_name,
    r.last_name,
    r.gender,
    r.birth_year,
    r.birth_date,
    r.city,
    r.club,
    r.category,
    r.finish_time,
    r.finish_time_display,
    r.overall_rank,
    r.gender_rank,
    r.category_rank,
    r.status,
    r.athlete_id,
    r.is_matched,
    r.matching_confidence,
    r.custom_fields,
    r.created_at,
    r.updated_at
  FROM external_results r
  WHERE r.external_event_id = p_event_id
  ORDER BY r.overall_rank ASC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_external_results TO authenticated;

COMMENT ON FUNCTION public.admin_get_external_results IS 
'Permet aux admins de récupérer tous les résultats d''un événement externe';
