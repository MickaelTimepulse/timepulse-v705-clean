/*
  # Create Admin User Creation Function
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION admin_create_user(
  p_email text,
  p_name text,
  p_password text,
  p_role_id uuid DEFAULT NULL
)
RETURNS uuid SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_hashed_password text;
BEGIN
  v_hashed_password := crypt(p_password, gen_salt('bf'));

  INSERT INTO admin_users (
    email,
    name,
    hashed_password,
    role_id,
    role,
    is_active
  )
  VALUES (
    p_email,
    p_name,
    v_hashed_password,
    p_role_id,
    COALESCE((SELECT name FROM admin_roles WHERE id = p_role_id), 'user'),
    true
  )
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION admin_create_user(text, text, text, uuid) TO anon, authenticated;
