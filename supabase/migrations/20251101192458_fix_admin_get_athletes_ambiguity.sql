/*
  # Fix ambiguous column reference in admin_get_athletes
  
  Corrects the ambiguous "id" reference by explicitly qualifying it as admin_users.id
*/

CREATE OR REPLACE FUNCTION admin_get_athletes(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_has_user_account boolean DEFAULT NULL,
  p_is_public boolean DEFAULT NULL,
  p_order_by text DEFAULT 'last_name'
)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  birthdate date,
  gender text,
  email text,
  slug text,
  is_public boolean,
  timepulse_index integer,
  has_user_account boolean,
  total_races bigint,
  total_podiums bigint,
  last_race_date timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin (qualification explicite)
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  
  RETURN QUERY
  WITH athlete_stats AS (
    SELECT 
      a.id,
      COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'finished') as races,
      COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'finished' AND r.overall_rank <= 3) as podiums,
      MAX(r.created_at) as last_race
    FROM athletes a
    LEFT JOIN results r ON r.athlete_id = a.id
    GROUP BY a.id
  )
  SELECT
    a.id,
    a.first_name,
    a.last_name,
    a.birthdate,
    a.gender,
    a.email,
    a.slug,
    a.is_public,
    a.timepulse_index,
    (a.user_id IS NOT NULL) as has_user_account,
    COALESCE(s.races, 0) as total_races,
    COALESCE(s.podiums, 0) as total_podiums,
    s.last_race as last_race_date,
    a.created_at
  FROM athletes a
  LEFT JOIN athlete_stats s ON s.id = a.id
  WHERE 
    (p_search IS NULL OR 
     a.first_name ILIKE '%' || p_search || '%' OR 
     a.last_name ILIKE '%' || p_search || '%' OR
     a.email ILIKE '%' || p_search || '%')
    AND (p_gender IS NULL OR a.gender = p_gender)
    AND (p_has_user_account IS NULL OR (a.user_id IS NOT NULL) = p_has_user_account)
    AND (p_is_public IS NULL OR a.is_public = p_is_public)
  ORDER BY
    CASE WHEN p_order_by = 'last_name' THEN a.last_name END ASC,
    CASE WHEN p_order_by = 'first_name' THEN a.first_name END ASC,
    CASE WHEN p_order_by = 'created_at' THEN a.created_at::text END DESC,
    CASE WHEN p_order_by = 'timepulse_index' THEN a.timepulse_index::text END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
