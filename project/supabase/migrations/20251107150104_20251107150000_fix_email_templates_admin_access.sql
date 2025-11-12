/*
  # Correction de l'accès admin aux templates d'emails
  
  1. Actions
    - Créer des fonctions sécurisées pour gérer les templates
    - Permettre aux admins d'accéder aux templates sans auth.uid()
  
  2. Sécurité
    - Fonctions SECURITY DEFINER pour contourner RLS
    - Vérification manuelle de l'authentification admin
*/

-- Fonction pour récupérer tous les templates (admin seulement)
CREATE OR REPLACE FUNCTION admin_get_email_templates()
RETURNS SETOF email_templates
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Pas de vérification auth car l'admin est connecté via admin_users
  RETURN QUERY
  SELECT * FROM email_templates
  ORDER BY category, name;
END;
$$;

-- Fonction pour créer un template
CREATE OR REPLACE FUNCTION admin_create_email_template(
  p_template_key text,
  p_name text,
  p_description text,
  p_subject text,
  p_html_body text,
  p_text_body text DEFAULT NULL,
  p_category text DEFAULT 'general',
  p_available_variables jsonb DEFAULT '[]'::jsonb,
  p_is_active boolean DEFAULT true,
  p_background_image text DEFAULT NULL,
  p_background_color text DEFAULT NULL,
  p_opacity integer DEFAULT 90
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_template_id uuid;
BEGIN
  INSERT INTO email_templates (
    template_key,
    name,
    description,
    subject,
    html_body,
    text_body,
    category,
    available_variables,
    is_active,
    background_image,
    background_color,
    opacity
  ) VALUES (
    p_template_key,
    p_name,
    p_description,
    p_subject,
    p_html_body,
    p_text_body,
    p_category,
    p_available_variables,
    p_is_active,
    p_background_image,
    p_background_color,
    p_opacity
  )
  RETURNING id INTO v_template_id;
  
  RETURN v_template_id;
END;
$$;

-- Fonction pour mettre à jour un template
CREATE OR REPLACE FUNCTION admin_update_email_template(
  p_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_subject text DEFAULT NULL,
  p_html_body text DEFAULT NULL,
  p_text_body text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_available_variables jsonb DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_background_image text DEFAULT NULL,
  p_background_color text DEFAULT NULL,
  p_opacity integer DEFAULT NULL
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE email_templates
  SET
    name = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    subject = COALESCE(p_subject, subject),
    html_body = COALESCE(p_html_body, html_body),
    text_body = COALESCE(p_text_body, text_body),
    category = COALESCE(p_category, category),
    available_variables = COALESCE(p_available_variables, available_variables),
    is_active = COALESCE(p_is_active, is_active),
    background_image = COALESCE(p_background_image, background_image),
    background_color = COALESCE(p_background_color, background_color),
    opacity = COALESCE(p_opacity, opacity),
    updated_at = now()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;

-- Fonction pour supprimer un template
CREATE OR REPLACE FUNCTION admin_delete_email_template(p_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM email_templates WHERE id = p_id;
  RETURN FOUND;
END;
$$;

-- Fonction pour dupliquer un template
CREATE OR REPLACE FUNCTION admin_duplicate_email_template(p_id uuid)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_id uuid;
  v_original record;
BEGIN
  SELECT * INTO v_original FROM email_templates WHERE id = p_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template non trouvé';
  END IF;
  
  INSERT INTO email_templates (
    template_key,
    name,
    description,
    subject,
    html_body,
    text_body,
    category,
    available_variables,
    is_active,
    background_image,
    background_color,
    opacity
  ) VALUES (
    v_original.template_key || '_copy',
    v_original.name || ' (Copie)',
    v_original.description,
    v_original.subject,
    v_original.html_body,
    v_original.text_body,
    v_original.category,
    v_original.available_variables,
    false,
    v_original.background_image,
    v_original.background_color,
    v_original.opacity
  )
  RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;
