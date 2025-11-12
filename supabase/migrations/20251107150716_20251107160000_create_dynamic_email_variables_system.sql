/*
  # Système de variables d'emails dynamiques
  
  1. Tables
    - Ajouter des champs pour mapper les options aux variables d'emails
    - Créer une fonction pour générer les variables dynamiquement
  
  2. Fonctionnalités
    - Variables de base (toujours présentes)
    - Variables d'options (selon ce que l'athlète a choisi)
    - Fonction de remplacement de variables
  
  3. Sécurité
    - Fonction SECURITY DEFINER pour accès contrôlé
*/

-- Fonction pour obtenir toutes les variables disponibles pour un email d'inscription
CREATE OR REPLACE FUNCTION get_registration_email_variables(p_entry_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_variables jsonb := '{}'::jsonb;
  v_entry record;
  v_athlete record;
  v_race record;
  v_event record;
  v_option record;
BEGIN
  -- Récupérer les données de l'inscription
  SELECT * INTO v_entry FROM entries WHERE id = p_entry_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inscription non trouvée';
  END IF;
  
  -- Récupérer les données de l'athlète
  SELECT * INTO v_athlete FROM athletes WHERE id = v_entry.athlete_id;
  
  -- Récupérer les données de la course
  SELECT * INTO v_race FROM races WHERE id = v_entry.race_id;
  
  -- Récupérer les données de l'événement
  SELECT * INTO v_event FROM events WHERE id = v_race.event_id;
  
  -- Variables de base
  v_variables := jsonb_build_object(
    'athlete_name', COALESCE(v_athlete.first_name || ' ' || v_athlete.last_name, ''),
    'athlete_first_name', COALESCE(v_athlete.first_name, ''),
    'athlete_last_name', COALESCE(v_athlete.last_name, ''),
    'athlete_email', COALESCE(v_entry.email, v_athlete.email, ''),
    'athlete_phone', COALESCE(v_entry.phone, ''),
    'athlete_gender', COALESCE(v_athlete.gender, ''),
    'athlete_birthdate', COALESCE(v_athlete.date_of_birth::text, ''),
    'athlete_nationality', COALESCE(v_athlete.nationality, ''),
    'athlete_club', COALESCE(v_entry.club, ''),
    'athlete_license', COALESCE(v_entry.license_number, ''),
    'event_name', COALESCE(v_event.name, ''),
    'event_date', COALESCE(to_char(v_event.start_date, 'DD/MM/YYYY'), ''),
    'event_location', COALESCE(v_event.location, ''),
    'event_description', COALESCE(v_event.description, ''),
    'race_name', COALESCE(v_race.name, ''),
    'race_distance', COALESCE(v_race.distance::text || ' km', ''),
    'bib_number', COALESCE(v_entry.bib_number::text, 'Non attribué'),
    'registration_date', COALESCE(to_char(v_entry.created_at, 'DD/MM/YYYY'), ''),
    'registration_time', COALESCE(to_char(v_entry.created_at, 'HH24:MI'), ''),
    'management_code', COALESCE(v_entry.management_code, ''),
    'amount', COALESCE((v_entry.amount_cents / 100.0)::text || ' €', '0 €'),
    'payment_status', COALESCE(v_entry.payment_status, 'en_attente'),
    'entry_status', COALESCE(v_entry.status, 'pending')
  );
  
  -- Ajouter les options sélectionnées
  FOR v_option IN
    SELECT 
      ro.option_id,
      roo.name as option_name,
      roo.label as option_label,
      ro.value,
      ro.quantity,
      CASE 
        WHEN ro.choice_id IS NOT NULL THEN (
          SELECT rooc.label 
          FROM race_option_choices rooc 
          WHERE rooc.id = ro.choice_id
        )
        ELSE NULL
      END as choice_label,
      CASE 
        WHEN ro.price_paid_cents IS NOT NULL 
        THEN (ro.price_paid_cents / 100.0)::text || ' €'
        ELSE '0 €'
      END as option_price
    FROM registration_options ro
    JOIN race_options roo ON roo.id = ro.option_id
    WHERE ro.entry_id = p_entry_id
  LOOP
    -- Créer une clé normalisée pour la variable (ex: "option_tshirt_size")
    DECLARE
      v_key text := 'option_' || regexp_replace(lower(v_option.option_name), '[^a-z0-9]+', '_', 'g');
      v_value text := COALESCE(v_option.choice_label, v_option.value, '');
    BEGIN
      -- Ajouter la variable
      v_variables := v_variables || jsonb_build_object(
        v_key, v_value,
        v_key || '_quantity', COALESCE(v_option.quantity::text, '1'),
        v_key || '_price', v_option.option_price
      );
    END;
  END LOOP;
  
  RETURN v_variables;
END;
$$;

-- Fonction pour remplacer les variables dans un template d'email
CREATE OR REPLACE FUNCTION replace_email_variables(
  p_template_html text,
  p_variables jsonb
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_result text := p_template_html;
  v_key text;
  v_value text;
BEGIN
  -- Remplacer chaque variable
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    v_result := replace(v_result, '{{' || v_key || '}}', COALESCE(v_value, ''));
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- Fonction pour obtenir le HTML d'un email prêt à envoyer
CREATE OR REPLACE FUNCTION prepare_registration_email(
  p_entry_id uuid,
  p_template_key text
)
RETURNS TABLE(
  subject text,
  html_body text,
  to_email text,
  variables jsonb
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_template record;
  v_variables jsonb;
  v_entry record;
BEGIN
  -- Récupérer le template
  SELECT * INTO v_template
  FROM email_templates
  WHERE template_key = p_template_key
    AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template % non trouvé ou inactif', p_template_key;
  END IF;
  
  -- Récupérer les variables
  v_variables := get_registration_email_variables(p_entry_id);
  
  -- Récupérer l'email de l'inscription
  SELECT email INTO v_entry FROM entries WHERE id = p_entry_id;
  
  -- Retourner l'email préparé
  RETURN QUERY SELECT
    replace_email_variables(v_template.subject, v_variables),
    replace_email_variables(v_template.html_body, v_variables),
    v_entry.email,
    v_variables;
END;
$$;

-- Fonction pour lister toutes les variables disponibles (pour l'interface admin)
CREATE OR REPLACE FUNCTION admin_get_available_email_variables()
RETURNS TABLE(
  category text,
  variable_key text,
  variable_name text,
  description text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (VALUES
    -- Variables athlète
    ('athlete'::text, 'athlete_name'::text, 'Nom complet'::text, 'Prénom + Nom de l''athlète'::text),
    ('athlete', 'athlete_first_name', 'Prénom', 'Prénom de l''athlète'),
    ('athlete', 'athlete_last_name', 'Nom', 'Nom de famille de l''athlète'),
    ('athlete', 'athlete_email', 'Email', 'Adresse email de l''athlète'),
    ('athlete', 'athlete_phone', 'Téléphone', 'Numéro de téléphone'),
    ('athlete', 'athlete_gender', 'Genre', 'Genre de l''athlète'),
    ('athlete', 'athlete_birthdate', 'Date de naissance', 'Date de naissance'),
    ('athlete', 'athlete_nationality', 'Nationalité', 'Code pays (FRA, BEL, etc)'),
    ('athlete', 'athlete_club', 'Club', 'Nom du club'),
    ('athlete', 'athlete_license', 'Licence', 'Numéro de licence FFA/FFTri'),
    
    -- Variables événement
    ('event', 'event_name', 'Nom de l''événement', 'Nom complet de l''événement'),
    ('event', 'event_date', 'Date', 'Date de l''événement (JJ/MM/AAAA)'),
    ('event', 'event_location', 'Lieu', 'Ville de l''événement'),
    ('event', 'event_description', 'Description', 'Description de l''événement'),
    
    -- Variables course
    ('race', 'race_name', 'Nom de la course', 'Nom de la course'),
    ('race', 'race_distance', 'Distance', 'Distance en km'),
    
    -- Variables inscription
    ('registration', 'bib_number', 'Dossard', 'Numéro de dossard'),
    ('registration', 'registration_date', 'Date d''inscription', 'Date d''inscription (JJ/MM/AAAA)'),
    ('registration', 'registration_time', 'Heure d''inscription', 'Heure (HH:MM)'),
    ('registration', 'management_code', 'Code de gestion', 'Code unique de gestion'),
    ('registration', 'amount', 'Montant', 'Montant total payé'),
    ('registration', 'payment_status', 'Statut paiement', 'Statut du paiement'),
    ('registration', 'entry_status', 'Statut inscription', 'Statut de l''inscription')
  ) AS t(category, variable_key, variable_name, description);
  
  -- Note: Les variables d'options sont ajoutées dynamiquement selon les options configurées
  -- Format: option_[nom_option] (ex: option_tshirt_size, option_meal, etc.)
END;
$$;

-- Commentaire sur l'utilisation
COMMENT ON FUNCTION get_registration_email_variables IS 
'Génère toutes les variables disponibles pour une inscription, incluant les options sélectionnées';

COMMENT ON FUNCTION replace_email_variables IS 
'Remplace les variables {{variable}} dans un template HTML par leurs valeurs';

COMMENT ON FUNCTION prepare_registration_email IS 
'Prépare un email complet avec toutes les variables remplacées, prêt à envoyer';

COMMENT ON FUNCTION admin_get_available_email_variables IS 
'Liste toutes les variables standard disponibles pour les templates d''emails';
