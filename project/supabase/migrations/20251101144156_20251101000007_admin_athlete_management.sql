/*
  # Gestion Admin des Athlètes

  Fonctions pour permettre aux admins de :
  - Voir tous les athlètes (avec pagination et filtres)
  - Modifier n'importe quel profil athlète
  - Fusionner des doublons
  - Voir les statistiques
  - Gérer la visibilité des profils
*/

-- ============================================
-- FONCTION : Liste des athlètes avec statistiques
-- ============================================

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
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) THEN
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
    CASE WHEN p_order_by = 'last_name' THEN a.last_name END,
    CASE WHEN p_order_by = 'first_name' THEN a.first_name END,
    CASE WHEN p_order_by = 'timepulse_index' THEN a.timepulse_index END DESC,
    CASE WHEN p_order_by = 'created_at' THEN a.created_at END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================
-- FONCTION : Détail d'un athlète
-- ============================================

CREATE OR REPLACE FUNCTION admin_get_athlete_details(p_athlete_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  
  SELECT json_build_object(
    'athlete', row_to_json(a.*),
    'profile', row_to_json(ap.*),
    'stats', json_build_object(
      'total_races', (SELECT COUNT(*) FROM results WHERE athlete_id = p_athlete_id AND status = 'finished'),
      'total_podiums', (SELECT COUNT(*) FROM results WHERE athlete_id = p_athlete_id AND status = 'finished' AND overall_rank <= 3),
      'total_wins', (SELECT COUNT(*) FROM results WHERE athlete_id = p_athlete_id AND status = 'finished' AND overall_rank = 1),
      'total_badges', (SELECT COUNT(*) FROM athlete_badges WHERE athlete_id = p_athlete_id),
      'total_training_logs', (SELECT COUNT(*) FROM training_logs WHERE athlete_id = p_athlete_id),
      'total_photos', (SELECT COUNT(*) FROM athlete_photos WHERE athlete_id = p_athlete_id)
    ),
    'records', (
      SELECT json_agg(json_build_object(
        'race_type', rt.name,
        'best_time', ar.best_time,
        'achieved_at', ar.achieved_at
      ))
      FROM athlete_records ar
      JOIN race_types rt ON ar.race_type_id = rt.id
      WHERE ar.athlete_id = p_athlete_id
    ),
    'recent_results', (
      SELECT json_agg(json_build_object(
        'race_name', e.name,
        'finish_time', r.finish_time,
        'overall_rank', r.overall_rank,
        'date', e.start_date
      ))
      FROM results r
      JOIN races ra ON r.race_id = ra.id
      JOIN events e ON ra.event_id = e.id
      WHERE r.athlete_id = p_athlete_id
      ORDER BY e.start_date DESC
      LIMIT 10
    )
  ) INTO v_result
  FROM athletes a
  LEFT JOIN athlete_profiles ap ON a.id = ap.athlete_id
  WHERE a.id = p_athlete_id;
  
  RETURN v_result;
END;
$$;

-- ============================================
-- FONCTION : Mettre à jour un athlète
-- ============================================

CREATE OR REPLACE FUNCTION admin_update_athlete(
  p_athlete_id uuid,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_birthdate date DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_is_public boolean DEFAULT NULL,
  p_nationality text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_license_club text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  
  -- Mettre à jour l'athlète
  UPDATE athletes
  SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    birthdate = COALESCE(p_birthdate, birthdate),
    gender = COALESCE(p_gender, gender),
    email = COALESCE(p_email, email),
    is_public = COALESCE(p_is_public, is_public),
    nationality = COALESCE(p_nationality, nationality),
    city = COALESCE(p_city, city),
    license_club = COALESCE(p_license_club, license_club),
    updated_at = NOW()
  WHERE id = p_athlete_id;
  
  -- Retourner l'athlète mis à jour
  SELECT row_to_json(a.*) INTO v_result
  FROM athletes a
  WHERE a.id = p_athlete_id;
  
  -- Log de l'action
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    changes
  ) VALUES (
    auth.uid(),
    'update',
    'athletes',
    p_athlete_id,
    json_build_object(
      'first_name', p_first_name,
      'last_name', p_last_name,
      'email', p_email
    )
  );
  
  RETURN v_result;
END;
$$;

-- ============================================
-- FONCTION : Supprimer un athlète (soft delete)
-- ============================================

CREATE OR REPLACE FUNCTION admin_delete_athlete(
  p_athlete_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  
  -- Vérifier que l'athlète existe
  IF NOT EXISTS (SELECT 1 FROM athletes WHERE id = p_athlete_id) THEN
    RAISE EXCEPTION 'Athlete not found';
  END IF;
  
  -- Log avant suppression
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    changes
  ) VALUES (
    auth.uid(),
    'delete',
    'athletes',
    p_athlete_id,
    json_build_object('reason', p_reason)
  );
  
  -- Supprimer l'athlète (cascade sur les tables liées)
  DELETE FROM athletes WHERE id = p_athlete_id;
  
  RETURN true;
END;
$$;

-- ============================================
-- FONCTION : Statistiques globales athlètes
-- ============================================

CREATE OR REPLACE FUNCTION admin_get_athletes_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  
  SELECT json_build_object(
    'total_athletes', (SELECT COUNT(*) FROM athletes),
    'with_user_account', (SELECT COUNT(*) FROM athletes WHERE user_id IS NOT NULL),
    'public_profiles', (SELECT COUNT(*) FROM athletes WHERE is_public = true),
    'by_gender', (
      SELECT json_object_agg(gender, count)
      FROM (
        SELECT gender, COUNT(*) as count
        FROM athletes
        GROUP BY gender
      ) g
    ),
    'with_results', (
      SELECT COUNT(DISTINCT athlete_id) 
      FROM results 
      WHERE athlete_id IS NOT NULL
    ),
    'recent_signups', (
      SELECT COUNT(*) 
      FROM athletes 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    ),
    'top_timepulse_index', (
      SELECT json_agg(json_build_object(
        'name', first_name || ' ' || last_name,
        'index', timepulse_index
      ))
      FROM (
        SELECT first_name, last_name, timepulse_index
        FROM athletes
        WHERE timepulse_index > 0
        ORDER BY timepulse_index DESC
        LIMIT 10
      ) top
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- ============================================
-- FONCTION : Recherche avancée d'athlètes
-- ============================================

CREATE OR REPLACE FUNCTION admin_search_athletes(
  p_query text,
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  birthdate date,
  email text,
  slug text,
  timepulse_index integer,
  relevance real
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  
  RETURN QUERY
  SELECT
    a.id,
    a.first_name,
    a.last_name,
    a.birthdate,
    a.email,
    a.slug,
    a.timepulse_index,
    ts_rank(
      to_tsvector('french', a.first_name || ' ' || a.last_name || ' ' || COALESCE(a.email, '')),
      plainto_tsquery('french', p_query)
    ) as relevance
  FROM athletes a
  WHERE 
    to_tsvector('french', a.first_name || ' ' || a.last_name || ' ' || COALESCE(a.email, ''))
    @@ plainto_tsquery('french', p_query)
  ORDER BY relevance DESC, a.last_name, a.first_name
  LIMIT p_limit;
END;
$$;

-- ============================================
-- FONCTION : Lier un compte utilisateur à un athlète
-- ============================================

CREATE OR REPLACE FUNCTION admin_link_user_to_athlete(
  p_athlete_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  
  -- Vérifier que l'athlète existe
  IF NOT EXISTS (SELECT 1 FROM athletes WHERE id = p_athlete_id) THEN
    RAISE EXCEPTION 'Athlete not found';
  END IF;
  
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Lier
  UPDATE athletes
  SET user_id = p_user_id,
      updated_at = NOW()
  WHERE id = p_athlete_id;
  
  -- Log
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    changes
  ) VALUES (
    auth.uid(),
    'link_user',
    'athletes',
    p_athlete_id,
    json_build_object('user_id', p_user_id)
  );
  
  RETURN true;
END;
$$;

-- ============================================
-- FONCTION : Recalculer l'indice d'un athlète manuellement
-- ============================================

CREATE OR REPLACE FUNCTION admin_recalculate_athlete_index(p_athlete_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_index integer;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;
  
  -- Recalculer
  v_new_index := calculate_timepulse_index(p_athlete_id);
  
  RETURN v_new_index;
END;
$$;
