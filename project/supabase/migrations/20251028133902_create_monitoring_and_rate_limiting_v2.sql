/*
  # Système de monitoring temps réel et rate limiting

  1. Tables créées
    - `registration_attempts` : Log de toutes les tentatives d'inscription (rate limiting)

  2. Vues créées
    - `v_registration_stats_hourly` : Stats par heure (24h glissantes)
    - `v_race_capacity_status` : État des capacités par course
    - `v_registration_errors` : Analyse des erreurs
    - `v_top_events_today` : Top événements du jour

  3. Fonctions
    - `log_registration_attempt` : Logger une tentative d'inscription
    - `check_rate_limit` : Vérifier si un IP/session dépasse le rate limit
    - `get_registration_stats` : Récupérer les stats pour dashboard

  4. Indexes
    - Optimisation pour requêtes temps réel
*/

-- Table pour logger les tentatives d'inscription (rate limiting)
CREATE TABLE IF NOT EXISTS registration_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT,
  session_id TEXT,
  user_agent TEXT,
  race_id UUID REFERENCES races(id),
  event_id UUID REFERENCES events(id),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'rate_limited', 'quota_exceeded')),
  error_code TEXT,
  error_message TEXT,
  response_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour rate limiting (recherche rapide par IP/session)
CREATE INDEX IF NOT EXISTS idx_registration_attempts_ip_time 
ON registration_attempts(ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registration_attempts_session_time 
ON registration_attempts(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registration_attempts_status_time 
ON registration_attempts(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registration_attempts_race 
ON registration_attempts(race_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registration_attempts_event 
ON registration_attempts(event_id, created_at DESC);

-- Activer RLS
ALTER TABLE registration_attempts ENABLE ROW LEVEL SECURITY;

-- Policy : Admins peuvent tout voir
CREATE POLICY "Admins can view all attempts"
  ON registration_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Vue : Statistiques horaires des inscriptions (24h glissantes)
CREATE OR REPLACE VIEW v_registration_stats_hourly AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'rate_limited') as rate_limited,
  COUNT(*) FILTER (WHERE status = 'quota_exceeded') as quota_exceeded,
  ROUND(AVG(response_time_ms)) as avg_response_time_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)) as p95_response_time_ms,
  COUNT(DISTINCT ip_address) as unique_ips,
  COUNT(DISTINCT session_id) as unique_sessions
FROM registration_attempts
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Vue : État des capacités par course
CREATE OR REPLACE VIEW v_race_capacity_status AS
SELECT 
  r.id as race_id,
  r.name as race_name,
  e.id as event_id,
  e.name as event_name,
  e.start_date,
  e.end_date,
  r.max_participants,
  COUNT(en.id) FILTER (WHERE en.status IN ('confirmed', 'pending')) as current_registrations,
  r.max_participants - COUNT(en.id) FILTER (WHERE en.status IN ('confirmed', 'pending')) as places_remaining,
  ROUND(
    (COUNT(en.id) FILTER (WHERE en.status IN ('confirmed', 'pending'))::NUMERIC / 
     NULLIF(r.max_participants, 0) * 100), 
    1
  ) as fill_percentage,
  CASE 
    WHEN COUNT(en.id) FILTER (WHERE en.status IN ('confirmed', 'pending')) >= r.max_participants THEN 'full'
    WHEN COUNT(en.id) FILTER (WHERE en.status IN ('confirmed', 'pending'))::NUMERIC / NULLIF(r.max_participants, 0) >= 0.9 THEN 'critical'
    WHEN COUNT(en.id) FILTER (WHERE en.status IN ('confirmed', 'pending'))::NUMERIC / NULLIF(r.max_participants, 0) >= 0.7 THEN 'warning'
    ELSE 'available'
  END as capacity_status
FROM races r
JOIN events e ON e.id = r.event_id
LEFT JOIN entries en ON en.race_id = r.id
WHERE e.start_date >= CURRENT_DATE
GROUP BY r.id, r.name, e.id, e.name, e.start_date, e.end_date, r.max_participants
ORDER BY e.start_date, r.name;

-- Vue : Analyse des erreurs
CREATE OR REPLACE VIEW v_registration_errors AS
SELECT 
  error_code,
  error_message,
  COUNT(*) as error_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as errors_last_hour,
  MAX(created_at) as last_occurrence,
  ARRAY_AGG(DISTINCT race_id) FILTER (WHERE race_id IS NOT NULL) as affected_races
FROM registration_attempts
WHERE status IN ('failed', 'rate_limited', 'quota_exceeded')
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_code, error_message
ORDER BY error_count DESC;

-- Vue : Top événements du jour
CREATE OR REPLACE VIEW v_top_events_today AS
SELECT 
  e.id as event_id,
  e.name as event_name,
  e.slug,
  COUNT(DISTINCT ra.id) as total_attempts,
  COUNT(DISTINCT ra.id) FILTER (WHERE ra.status = 'success') as successful_registrations,
  COUNT(DISTINCT ra.ip_address) as unique_visitors,
  ROUND(
    COUNT(DISTINCT ra.id) FILTER (WHERE ra.status = 'success')::NUMERIC / 
    NULLIF(COUNT(DISTINCT ra.id), 0) * 100,
    1
  ) as conversion_rate
FROM events e
LEFT JOIN registration_attempts ra ON ra.event_id = e.id 
  AND ra.created_at >= CURRENT_DATE
  AND ra.created_at < CURRENT_DATE + INTERVAL '1 day'
WHERE e.start_date >= CURRENT_DATE
GROUP BY e.id, e.name, e.slug
ORDER BY successful_registrations DESC
LIMIT 20;

-- Fonction : Vérifier le rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_max_attempts INT DEFAULT 5,
  p_window_minutes INT DEFAULT 10
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ip_attempts INT := 0;
  v_session_attempts INT := 0;
  v_is_limited BOOLEAN := false;
  v_retry_after TIMESTAMPTZ;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Compter les tentatives par IP dans la fenêtre
  IF p_ip_address IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ip_attempts
    FROM registration_attempts
    WHERE ip_address = p_ip_address
      AND created_at > v_window_start;
    
    IF v_ip_attempts >= p_max_attempts THEN
      v_is_limited := true;
      SELECT created_at + (p_window_minutes || ' minutes')::INTERVAL 
      INTO v_retry_after
      FROM registration_attempts
      WHERE ip_address = p_ip_address
        AND created_at > v_window_start
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
  END IF;
  
  -- Compter les tentatives par session dans la fenêtre
  IF p_session_id IS NOT NULL AND NOT v_is_limited THEN
    SELECT COUNT(*) INTO v_session_attempts
    FROM registration_attempts
    WHERE session_id = p_session_id
      AND created_at > v_window_start;
    
    IF v_session_attempts >= p_max_attempts THEN
      v_is_limited := true;
      SELECT created_at + (p_window_minutes || ' minutes')::INTERVAL 
      INTO v_retry_after
      FROM registration_attempts
      WHERE session_id = p_session_id
        AND created_at > v_window_start
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'is_limited', v_is_limited,
    'ip_attempts', v_ip_attempts,
    'session_attempts', v_session_attempts,
    'max_attempts', p_max_attempts,
    'window_minutes', p_window_minutes,
    'retry_after', v_retry_after,
    'seconds_until_retry', CASE 
      WHEN v_retry_after IS NOT NULL THEN EXTRACT(EPOCH FROM (v_retry_after - NOW()))::INT
      ELSE NULL
    END
  );
END;
$$;

-- Fonction : Logger une tentative d'inscription
CREATE OR REPLACE FUNCTION log_registration_attempt(
  p_ip_address TEXT,
  p_session_id TEXT,
  p_user_agent TEXT,
  p_race_id UUID,
  p_event_id UUID,
  p_status TEXT,
  p_error_code TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_response_time_ms INT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_id UUID;
BEGIN
  INSERT INTO registration_attempts (
    ip_address,
    session_id,
    user_agent,
    race_id,
    event_id,
    status,
    error_code,
    error_message,
    response_time_ms
  ) VALUES (
    p_ip_address,
    p_session_id,
    p_user_agent,
    p_race_id,
    p_event_id,
    p_status,
    p_error_code,
    p_error_message,
    p_response_time_ms
  )
  RETURNING id INTO v_attempt_id;
  
  RETURN v_attempt_id;
END;
$$;

-- Fonction : Récupérer les stats pour dashboard
CREATE OR REPLACE FUNCTION get_registration_stats(
  p_hours INT DEFAULT 24
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
  v_start_time TIMESTAMPTZ;
BEGIN
  v_start_time := NOW() - (p_hours || ' hours')::INTERVAL;
  
  SELECT jsonb_build_object(
    'total_attempts', COUNT(*),
    'successful', COUNT(*) FILTER (WHERE status = 'success'),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'rate_limited', COUNT(*) FILTER (WHERE status = 'rate_limited'),
    'quota_exceeded', COUNT(*) FILTER (WHERE status = 'quota_exceeded'),
    'success_rate', ROUND(
      COUNT(*) FILTER (WHERE status = 'success')::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100,
      2
    ),
    'avg_response_time_ms', ROUND(AVG(response_time_ms)),
    'p95_response_time_ms', ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)),
    'unique_ips', COUNT(DISTINCT ip_address),
    'unique_sessions', COUNT(DISTINCT session_id),
    'period_hours', p_hours
  ) INTO v_stats
  FROM registration_attempts
  WHERE created_at > v_start_time;
  
  RETURN v_stats;
END;
$$;

-- Tâche de nettoyage automatique (garder seulement 7 jours de logs)
CREATE OR REPLACE FUNCTION cleanup_old_registration_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM registration_attempts
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Commenter les objets
COMMENT ON TABLE registration_attempts IS 'Log de toutes les tentatives d''inscription pour rate limiting et monitoring';
COMMENT ON FUNCTION check_rate_limit IS 'Vérifie si une IP ou session dépasse le rate limit';
COMMENT ON FUNCTION log_registration_attempt IS 'Enregistre une tentative d''inscription dans les logs';
COMMENT ON FUNCTION get_registration_stats IS 'Récupère les statistiques d''inscription pour le dashboard';
COMMENT ON VIEW v_registration_stats_hourly IS 'Statistiques d''inscription par heure (24h glissantes)';
COMMENT ON VIEW v_race_capacity_status IS 'État des capacités de chaque course en temps réel';
COMMENT ON VIEW v_registration_errors IS 'Analyse des erreurs d''inscription dans les dernières 24h';
COMMENT ON VIEW v_top_events_today IS 'Top 20 des événements les plus populaires aujourd''hui';
