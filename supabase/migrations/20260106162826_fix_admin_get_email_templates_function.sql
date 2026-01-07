/*
  # Corriger la fonction admin_get_email_templates

  1. Problème
    - La fonction utilise is_super_admin(auth.uid()) qui n'existe pas
    - Doit utiliser is_admin() à la place

  2. Solution
    - Recréer la fonction avec la bonne vérification is_admin()
*/

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS admin_get_email_templates();

-- Recréer la fonction avec la bonne vérification
CREATE FUNCTION admin_get_email_templates()
RETURNS TABLE (
  id uuid,
  template_key text,
  name text,
  description text,
  category text,
  subject text,
  html_body text,
  text_body text,
  plain_text_body text,
  available_variables jsonb,
  is_active boolean,
  recipient_type text,
  trigger_event text,
  cc_emails jsonb,
  background_image text,
  background_color text,
  opacity integer,
  color_opacity integer,
  header_image_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Accès refusé. Droits administrateur requis.';
  END IF;

  RETURN QUERY
  SELECT
    et.id,
    et.template_key,
    et.name,
    et.description,
    et.category,
    et.subject,
    et.html_body,
    et.text_body,
    et.plain_text_body,
    et.available_variables,
    et.is_active,
    et.recipient_type,
    et.trigger_event,
    et.cc_emails,
    et.background_image,
    et.background_color,
    et.opacity,
    COALESCE(et.color_opacity, 50) as color_opacity,
    et.header_image_url,
    et.created_at,
    et.updated_at
  FROM email_templates et
  ORDER BY et.category, et.name;
END;
$$;

-- Corriger aussi admin_update_email_template
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

  IF v_updated_template IS NULL THEN
    RAISE EXCEPTION 'Template non trouvé';
  END IF;

  -- Logger l'action
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    changes
  ) VALUES (
    auth.uid(),
    'update',
    'email_templates',
    p_id,
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
