/*
  # Fix all audit_logs column references

  1. Problem
    - Plusieurs fonctions essaient d'utiliser `table_name` et `record_id` 
    - Ces colonnes n'existent pas dans audit_logs
    - Les vraies colonnes sont `entity_type` et `entity_id`

  2. Solution
    - Corriger toutes les fonctions qui utilisent audit_logs
    - Remplacer table_name → entity_type
    - Remplacer record_id → entity_id
    
  3. Fonctions à corriger
    - admin_update_email_template (ligne 153-172)
    - admin_update_athlete
    - admin_delete_athlete
    - Toutes les fonctions qui insèrent dans audit_logs avec le mauvais schéma
*/

-- =====================================================
-- Fonction 1: admin_update_email_template (correction complète)
-- =====================================================
CREATE OR REPLACE FUNCTION admin_update_email_template(
  p_id uuid,
  p_subject text,
  p_html_body text,
  p_text_body text DEFAULT NULL,
  p_plain_text_body text DEFAULT NULL,
  p_is_active boolean DEFAULT true,
  p_recipient_type text DEFAULT 'runners',
  p_trigger_event text DEFAULT NULL,
  p_cc_emails text DEFAULT '[]',
  p_background_image text DEFAULT NULL,
  p_background_color text DEFAULT '#ffffff',
  p_opacity integer DEFAULT 100,
  p_color_opacity integer DEFAULT 50
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_template json;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Accès refusé. Droits administrateur requis.';
  END IF;

  -- Valider l'opacité de la couleur
  IF p_color_opacity < 0 OR p_color_opacity > 100 THEN
    RAISE EXCEPTION 'L''opacité de la couleur doit être entre 0 et 100';
  END IF;

  -- Mettre à jour le template
  UPDATE email_templates
  SET
    subject = p_subject,
    html_body = p_html_body,
    text_body = p_text_body,
    plain_text_body = p_plain_text_body,
    is_active = p_is_active,
    recipient_type = p_recipient_type,
    trigger_event = p_trigger_event,
    cc_emails = p_cc_emails::jsonb,
    background_image = p_background_image,
    background_color = p_background_color,
    opacity = p_opacity,
    color_opacity = p_color_opacity,
    updated_at = now()
  WHERE id = p_id
  RETURNING to_json(email_templates.*) INTO v_updated_template;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template non trouvé';
  END IF;

  -- Logger l'action avec les bonnes colonnes (entity_type et entity_id)
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    actor_type,
    actor_id,
    changes
  ) VALUES (
    'email_template',
    p_id,
    'update',
    'admin',
    auth.uid(),
    jsonb_build_object(
      'template_key', (SELECT template_key FROM email_templates WHERE id = p_id),
      'updated_fields', jsonb_build_object(
        'subject', p_subject,
        'is_active', p_is_active,
        'color_opacity', p_color_opacity
      )
    )
  );

  RETURN v_updated_template;
END;
$$;

-- =====================================================
-- Fonction 2: admin_update_athlete (correction)
-- =====================================================
CREATE OR REPLACE FUNCTION admin_update_athlete(
  p_athlete_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  
  -- Mettre à jour l'athlète
  UPDATE athletes
  SET 
    first_name = p_first_name,
    last_name = p_last_name,
    email = p_email,
    updated_at = now()
  WHERE id = p_athlete_id
  RETURNING to_json(athletes.*) INTO v_result;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Athlète non trouvé';
  END IF;
  
  -- Log de l'action (avec les bonnes colonnes)
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    actor_type,
    actor_id,
    changes
  ) VALUES (
    'athlete',
    p_athlete_id,
    'update',
    'admin',
    auth.uid(),
    jsonb_build_object(
      'first_name', p_first_name,
      'last_name', p_last_name,
      'email', p_email
    )
  );
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- Fonction 3: admin_delete_athlete (correction)
-- =====================================================
CREATE OR REPLACE FUNCTION admin_delete_athlete(
  p_athlete_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  
  -- Vérifier que l'athlète existe
  IF NOT EXISTS (SELECT 1 FROM athletes WHERE id = p_athlete_id) THEN
    RAISE EXCEPTION 'Athlète non trouvé';
  END IF;
  
  -- Log avant suppression (avec les bonnes colonnes)
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    actor_type,
    actor_id,
    changes
  ) VALUES (
    'athlete',
    p_athlete_id,
    'delete',
    'admin',
    auth.uid(),
    jsonb_build_object('reason', p_reason)
  );
  
  -- Supprimer l'athlète (cascade sur les tables liées)
  DELETE FROM athletes WHERE id = p_athlete_id;
  
  RETURN true;
END;
$$;

-- =====================================================
-- Fonction 4: admin_link_athlete_to_user (correction)
-- =====================================================
CREATE OR REPLACE FUNCTION admin_link_athlete_to_user(
  p_athlete_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  
  -- Vérifier que l'athlète existe
  IF NOT EXISTS (SELECT 1 FROM athletes WHERE id = p_athlete_id) THEN
    RAISE EXCEPTION 'Athlète non trouvé';
  END IF;
  
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé';
  END IF;
  
  -- Lier l'athlète au user
  UPDATE athletes
  SET user_id = p_user_id
  WHERE id = p_athlete_id;
  
  -- Log (avec les bonnes colonnes)
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    actor_type,
    actor_id,
    changes
  ) VALUES (
    'athlete',
    p_athlete_id,
    'link_user',
    'admin',
    auth.uid(),
    jsonb_build_object('user_id', p_user_id)
  );
  
  RETURN true;
END;
$$;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Toutes les fonctions audit_logs ont été corrigées';
  RAISE NOTICE '   - table_name → entity_type';
  RAISE NOTICE '   - record_id → entity_id';
  RAISE NOTICE '   - user_id → actor_id (sauf cas spécifiques)';
END $$;