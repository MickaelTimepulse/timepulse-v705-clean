/*
  # Fonction pour récupérer la commission Timepulse active

  1. Nouvelle fonction
    - `get_active_timepulse_commission()` : retourne la commission en centimes
    
  2. Logique
    - Récupère la commission active à la date actuelle
    - Retourne 99 centimes par défaut si aucune commission active
*/

CREATE OR REPLACE FUNCTION get_active_timepulse_commission()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commission_cents INTEGER;
BEGIN
  SELECT commission_cents INTO v_commission_cents
  FROM timepulse_commission_settings
  WHERE is_active = true
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until > NOW())
  ORDER BY valid_from DESC
  LIMIT 1;
  
  -- Par défaut, retourner 99 centimes (0,99€)
  RETURN COALESCE(v_commission_cents, 99);
END;
$$;

-- Permettre l'accès public à cette fonction (lecture seule)
GRANT EXECUTE ON FUNCTION get_active_timepulse_commission() TO anon, authenticated;
