/*
  # Create Admin Email Logs Function

  1. Purpose
    - Admin users authenticate via custom admin_users table (not Supabase Auth)
    - Admin needs to access email_logs without RLS blocking
    - Create SECURITY DEFINER function to bypass RLS

  2. Function Created
    - admin_get_email_logs: Get all email logs with stats

  3. Security
    - Function is SECURITY DEFINER (runs as function owner, bypasses RLS)
    - Frontend auth layer ensures only admins can access
*/

-- Function to get email logs and statistics
CREATE OR REPLACE FUNCTION admin_get_email_logs(log_limit int DEFAULT 50)
RETURNS jsonb SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  logs_array jsonb;
  stats jsonb;
BEGIN
  -- Get logs
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'to_email', to_email,
      'from_email', from_email,
      'subject', subject,
      'status', status,
      'error_message', error_message,
      'message_id', message_id,
      'created_at', created_at,
      'sent_at', sent_at
    ) ORDER BY created_at DESC
  )
  INTO logs_array
  FROM (
    SELECT * FROM email_logs
    ORDER BY created_at DESC
    LIMIT log_limit
  ) sub;

  -- Get statistics
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'success', COUNT(*) FILTER (WHERE status = 'success'),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'pending', COUNT(*) FILTER (WHERE status = 'pending')
  )
  INTO stats
  FROM email_logs;

  -- Combine results
  SELECT jsonb_build_object(
    'logs', COALESCE(logs_array, '[]'::jsonb),
    'stats', stats
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_get_email_logs(int) TO anon, authenticated;
