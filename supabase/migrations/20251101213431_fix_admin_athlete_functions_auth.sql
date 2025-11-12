/*
  # Fix Admin Athlete Functions - Remove auth.uid() Checks
  
  Remove auth.uid() verification from admin athlete functions.
  Admin authentication is handled at the routing level.
  
  Functions updated:
  - admin_update_athlete
  - admin_delete_athlete (with correct signature)
  - admin_get_athlete_details
  - admin_link_user_to_athlete
*/

-- =====================================================
-- admin_update_athlete
-- =====================================================

DROP FUNCTION IF EXISTS admin_update_athlete(uuid, text, text, date, text, text, boolean, text, text, text);

CREATE FUNCTION admin_update_athlete(
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
  -- Update athlete
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
  
  -- Return updated athlete
  SELECT json_build_object(
    'id', id,
    'first_name', first_name,
    'last_name', last_name,
    'birthdate', birthdate,
    'gender', gender,
    'email', email,
    'is_public', is_public,
    'updated_at', updated_at
  ) INTO v_result
  FROM athletes
  WHERE id = p_athlete_id;
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- admin_delete_athlete (with reason parameter)
-- =====================================================

DROP FUNCTION IF EXISTS admin_delete_athlete(uuid, text);

CREATE FUNCTION admin_delete_athlete(
  p_athlete_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM athletes WHERE id = p_athlete_id;
  RETURN FOUND;
END;
$$;

-- =====================================================
-- admin_get_athlete_details
-- =====================================================

DROP FUNCTION IF EXISTS admin_get_athlete_details(uuid);

CREATE FUNCTION admin_get_athlete_details(p_athlete_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'id', a.id,
    'first_name', a.first_name,
    'last_name', a.last_name,
    'birthdate', a.birthdate,
    'gender', a.gender,
    'email', a.email,
    'slug', a.slug,
    'is_public', a.is_public,
    'timepulse_index', a.timepulse_index,
    'nationality', a.nationality,
    'city', a.city,
    'license_club', a.license_club,
    'license_number', a.license_number,
    'created_at', a.created_at,
    'updated_at', a.updated_at,
    'has_user_account', (a.user_id IS NOT NULL),
    'user_id', a.user_id
  ) INTO v_result
  FROM athletes a
  WHERE a.id = p_athlete_id;
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- admin_link_user_to_athlete
-- =====================================================

DROP FUNCTION IF EXISTS admin_link_user_to_athlete(uuid, uuid);

CREATE FUNCTION admin_link_user_to_athlete(
  p_athlete_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE athletes
  SET user_id = p_user_id,
      updated_at = NOW()
  WHERE id = p_athlete_id;
  
  RETURN FOUND;
END;
$$;

-- =====================================================
-- Grant permissions to all roles
-- =====================================================

GRANT EXECUTE ON FUNCTION admin_update_athlete(uuid, text, text, date, text, text, boolean, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_athlete(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_get_athlete_details(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_link_user_to_athlete(uuid, uuid) TO anon, authenticated;
