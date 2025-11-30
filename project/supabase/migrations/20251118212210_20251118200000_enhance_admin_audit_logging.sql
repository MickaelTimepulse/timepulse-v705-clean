/*
  # Amélioration du système de logs d'audit pour admins

  1. Nouvelles Fonctions
    - `admin_log_organizer_action` - Logger les actions sur les organisateurs
    - `admin_log_event_action` - Logger les actions sur les événements
    - `admin_get_audit_logs` - Récupérer les logs d'audit avec filtres
    - `admin_get_entity_history` - Historique complet d'une entité

  2. Améliorations
    - Support des actions admin sur organisateurs
    - Support des actions admin sur événements
    - Traçabilité complète avec email et nom de l'admin
    - Détails des modifications (before/after)

  3. Security
    - Fonctions SECURITY DEFINER pour permettre l'insertion
    - RLS déjà configuré pour la lecture
    - Logs immutables (pas de UPDATE/DELETE)
*/

-- Fonction pour logger les actions d'un admin sur un organisateur
CREATE OR REPLACE FUNCTION admin_log_organizer_action(
  p_organizer_id uuid,
  p_action text,
  p_admin_id uuid,
  p_changes jsonb DEFAULT NULL,
  p_description text DEFAULT NULL
) RETURNS uuid 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_admin_email text;
  v_admin_name text;
BEGIN
  -- Récupérer les infos de l'admin
  SELECT email, name INTO v_admin_email, v_admin_name
  FROM admin_users
  WHERE id = p_admin_id;

  -- Créer le log avec description enrichie
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    actor_type,
    actor_id,
    actor_email,
    changes,
    user_agent
  ) VALUES (
    'organizer',
    p_organizer_id,
    p_action,
    'admin',
    p_admin_id,
    v_admin_email,
    jsonb_build_object(
      'changes', p_changes,
      'description', p_description,
      'admin_name', v_admin_name
    ),
    NULL
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour logger les actions d'un admin sur un événement
CREATE OR REPLACE FUNCTION admin_log_event_action(
  p_event_id uuid,
  p_action text,
  p_admin_id uuid,
  p_changes jsonb DEFAULT NULL,
  p_description text DEFAULT NULL
) RETURNS uuid 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
  v_admin_email text;
  v_admin_name text;
  v_organizer_id uuid;
BEGIN
  -- Récupérer les infos de l'admin
  SELECT email, name INTO v_admin_email, v_admin_name
  FROM admin_users
  WHERE id = p_admin_id;

  -- Récupérer l'organizer_id de l'événement
  SELECT organizer_id INTO v_organizer_id
  FROM events
  WHERE id = p_event_id;

  -- Créer le log avec description enrichie
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    actor_type,
    actor_id,
    actor_email,
    changes,
    user_agent
  ) VALUES (
    'event',
    p_event_id,
    p_action,
    'admin',
    p_admin_id,
    v_admin_email,
    jsonb_build_object(
      'changes', p_changes,
      'description', p_description,
      'admin_name', v_admin_name,
      'organizer_id', v_organizer_id
    ),
    NULL
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les logs d'audit avec filtres
CREATE OR REPLACE FUNCTION admin_get_audit_logs(
  p_admin_id uuid,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_actor_type text DEFAULT NULL,
  p_action text DEFAULT NULL,
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0
) RETURNS TABLE (
  id uuid,
  entity_type text,
  entity_id uuid,
  entity_name text,
  action text,
  actor_type text,
  actor_id uuid,
  actor_email text,
  actor_name text,
  changes jsonb,
  description text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est un admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = p_admin_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.entity_type,
    al.entity_id,
    CASE 
      WHEN al.entity_type = 'organizer' THEN o.name
      WHEN al.entity_type = 'event' THEN e.name
      WHEN al.entity_type = 'race' THEN r.name
      ELSE NULL
    END as entity_name,
    al.action,
    al.actor_type,
    al.actor_id,
    al.actor_email,
    COALESCE(
      al.changes->>'admin_name',
      au.name
    ) as actor_name,
    al.changes,
    al.changes->>'description' as description,
    al.created_at
  FROM audit_logs al
  LEFT JOIN organizers o ON al.entity_type = 'organizer' AND al.entity_id = o.id
  LEFT JOIN events e ON al.entity_type = 'event' AND al.entity_id = e.id
  LEFT JOIN races r ON al.entity_type = 'race' AND al.entity_id = r.id
  LEFT JOIN admin_users au ON al.actor_type = 'admin' AND al.actor_id = au.id
  WHERE 
    (p_entity_type IS NULL OR al.entity_type = p_entity_type)
    AND (p_entity_id IS NULL OR al.entity_id = p_entity_id)
    AND (p_actor_type IS NULL OR al.actor_type = p_actor_type)
    AND (p_action IS NULL OR al.action = p_action)
  ORDER BY al.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer l'historique complet d'une entité
CREATE OR REPLACE FUNCTION admin_get_entity_history(
  p_admin_id uuid,
  p_entity_type text,
  p_entity_id uuid
) RETURNS TABLE (
  id uuid,
  action text,
  actor_type text,
  actor_name text,
  actor_email text,
  changes jsonb,
  description text,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est un admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.id = p_admin_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.action,
    al.actor_type,
    COALESCE(
      al.changes->>'admin_name',
      au.name,
      o.name
    ) as actor_name,
    al.actor_email,
    al.changes,
    al.changes->>'description' as description,
    al.created_at
  FROM audit_logs al
  LEFT JOIN admin_users au ON al.actor_type = 'admin' AND al.actor_id = au.id
  LEFT JOIN organizers o ON al.actor_type = 'organizer' AND al.actor_id = o.id
  WHERE 
    al.entity_type = p_entity_type
    AND al.entity_id = p_entity_id
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Ajouter un index pour les requêtes par organizer_id dans les changes
CREATE INDEX IF NOT EXISTS idx_audit_logs_organizer_id 
ON audit_logs USING gin ((changes->'organizer_id'));

-- Commentaires
COMMENT ON FUNCTION admin_log_organizer_action IS 'Logger les actions des admins sur les comptes organisateurs';
COMMENT ON FUNCTION admin_log_event_action IS 'Logger les actions des admins sur les événements';
COMMENT ON FUNCTION admin_get_audit_logs IS 'Récupérer les logs d''audit avec filtres avancés';
COMMENT ON FUNCTION admin_get_entity_history IS 'Récupérer l''historique complet d''une entité (organisateur, événement, etc.)';
