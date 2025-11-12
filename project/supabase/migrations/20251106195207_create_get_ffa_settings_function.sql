/*
  # Create FFA Settings Getter Function
  
  1. Purpose
    - Create a SECURITY DEFINER function to read FFA settings
    - Bypasses RLS restrictions
    - Returns key/value pairs for FFA credentials
    
  2. Security
    - SECURITY DEFINER (runs with owner privileges)
    - Available to all authenticated users
    - Only returns FFA-specific settings
*/

-- Function to get FFA settings (bypasses RLS)
CREATE OR REPLACE FUNCTION get_ffa_settings()
RETURNS TABLE(key text, value text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.key, s.value
  FROM settings s
  WHERE s.key IN ('ffa_api_uid', 'ffa_api_password');
END;
$$;

-- Grant execute to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_ffa_settings() TO authenticated, anon;

COMMENT ON FUNCTION get_ffa_settings() IS 'Returns FFA API credentials from settings, bypassing RLS';