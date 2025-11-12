/*
  # Fix Function Search Path for Core Functions

  1. Changes
    - Add SET search_path = public to core trigger and utility functions
    - This prevents potential security vulnerabilities

  2. Functions Fixed
    - Trigger functions that don't change signature
    - Utility functions with simple signatures
*/

-- Trigger function for updated_at
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers that use this function
CREATE TRIGGER set_updated_at BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON races
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update homepage features timestamp
DROP FUNCTION IF EXISTS update_homepage_features_updated_at() CASCADE;
CREATE FUNCTION update_homepage_features_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Generate athlete slug
DROP FUNCTION IF EXISTS generate_athlete_slug(text, text) CASCADE;
CREATE FUNCTION generate_athlete_slug(
  p_first_name text,
  p_last_name text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_counter int := 0;
  v_final_slug text;
BEGIN
  v_slug := lower(unaccent(p_first_name || '-' || p_last_name));
  v_slug := regexp_replace(v_slug, '[^a-z0-9-]', '-', 'g');
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  
  v_final_slug := v_slug;
  
  WHILE EXISTS (SELECT 1 FROM athletes WHERE slug = v_final_slug) LOOP
    v_counter := v_counter + 1;
    v_final_slug := v_slug || '-' || v_counter;
  END LOOP;
  
  RETURN v_final_slug;
END;
$$;

-- Match athlete by identity
DROP FUNCTION IF EXISTS match_athlete_by_identity(text, text, date, text) CASCADE;
CREATE FUNCTION match_athlete_by_identity(
  p_first_name text,
  p_last_name text,
  p_birthdate date,
  p_email text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_athlete_id uuid;
BEGIN
  SELECT id INTO v_athlete_id
  FROM athletes
  WHERE LOWER(first_name) = LOWER(p_first_name)
    AND LOWER(last_name) = LOWER(p_last_name)
    AND birthdate = p_birthdate
    AND (p_email IS NULL OR LOWER(email) = LOWER(p_email))
  LIMIT 1;
  
  RETURN v_athlete_id;
END;
$$;

-- Admin password functions
DROP FUNCTION IF EXISTS verify_admin_password(uuid, text) CASCADE;
CREATE FUNCTION verify_admin_password(
  p_user_id uuid,
  p_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hashed_password text;
BEGIN
  SELECT hashed_password INTO v_hashed_password
  FROM admin_users
  WHERE id = p_user_id;
  
  RETURN v_hashed_password = crypt(p_password, v_hashed_password);
END;
$$;

DROP FUNCTION IF EXISTS update_admin_password(uuid, text) CASCADE;
CREATE FUNCTION update_admin_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_users
  SET 
    hashed_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS update_last_login(uuid) CASCADE;
CREATE FUNCTION update_last_login(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_users
  SET last_login_at = now()
  WHERE id = p_user_id;
END;
$$;