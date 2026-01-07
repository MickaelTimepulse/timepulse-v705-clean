/*
  # Ajout de la catégorie FFA et fonction d'actualisation des licences

  1. Modifications
    - Ajoute le champ `ffa_catcod` (catégorie FFA) à la table `athletes`
    - Met à jour `admin_get_all_entries` pour inclure ce champ
    - Crée une fonction `refresh_ffa_licenses_for_race` pour actualiser toutes les licences d'une course

  2. Sécurité
    - La fonction est accessible uniquement aux organisateurs de l'événement
*/

-- Ajouter la colonne CAT FFA (CATCOD) à la table athletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'ffa_catcod'
  ) THEN
    ALTER TABLE athletes ADD COLUMN ffa_catcod text;
    COMMENT ON COLUMN athletes.ffa_catcod IS 'Code catégorie FFA (CATCOD) - Se met à jour automatiquement selon l''année sportive';
  END IF;
END $$;

-- Supprimer et recréer la fonction admin_get_all_entries avec le nouveau champ
DROP FUNCTION IF EXISTS admin_get_all_entries();

CREATE FUNCTION admin_get_all_entries()
RETURNS TABLE (
  id uuid,
  race_id uuid,
  event_id uuid,
  event_organizer_id uuid,
  bib_number text,
  status text,
  category text,
  amount numeric,
  paid_at timestamptz,
  refund_status text,
  refund_amount numeric,
  management_code text,
  pps_number text,
  pps_expiry_date date,
  ffa_relcod text,
  ffa_club_code text,
  ffa_league_abbr text,
  ffa_department_abbr text,
  ffa_catcod text,
  created_at timestamptz,
  registration_date timestamptz,
  event_name text,
  event_city text,
  race_name text,
  first_name text,
  last_name text,
  gender text,
  birthdate date,
  email text,
  phone_mobile text,
  nationality_code text,
  license_number text,
  license_type text,
  club text
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.race_id,
    r.event_id,
    ev.organizer_id as event_organizer_id,
    e.bib_number::text,
    e.payment_status as status,
    e.category_label as category,
    e.amount,
    e.paid_at,
    e.refund_status,
    e.refund_amount,
    e.management_code,
    a.pps_number,
    a.pps_expiry_date,
    a.ffa_relcod,
    a.ffa_club_code,
    a.ffa_league_abbr,
    a.ffa_department_abbr,
    a.ffa_catcod,
    e.created_at,
    e.registration_date,
    ev.name as event_name,
    ev.city as event_city,
    r.name as race_name,
    a.first_name,
    a.last_name,
    a.gender,
    a.birth_date as birthdate,
    a.email,
    a.phone_mobile,
    a.nationality_code,
    a.license_number,
    a.license_type,
    a.club
  FROM entries e
  INNER JOIN athletes a ON e.athlete_id = a.id
  INNER JOIN races r ON e.race_id = r.id
  INNER JOIN events ev ON r.event_id = ev.id
  ORDER BY e.created_at DESC;
END;
$$;

-- Créer une fonction pour actualiser toutes les licences FFA d'une course
CREATE OR REPLACE FUNCTION refresh_ffa_licenses_for_race(p_race_id uuid)
RETURNS TABLE (
  total_entries integer,
  updated_count integer,
  error_count integer,
  details jsonb
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_organizer_id uuid;
  v_entry_record RECORD;
  v_total integer := 0;
  v_updated integer := 0;
  v_errors integer := 0;
  v_details jsonb := '[]'::jsonb;
BEGIN
  -- Vérifier que l'utilisateur est bien l'organisateur de l'événement
  SELECT ev.organizer_id INTO v_organizer_id
  FROM races r
  INNER JOIN events ev ON r.event_id = ev.id
  WHERE r.id = p_race_id;

  IF v_organizer_id IS NULL THEN
    RAISE EXCEPTION 'Race not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM organizers
    WHERE id = v_organizer_id
    AND user_id = auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: not the organizer';
  END IF;

  -- Parcourir toutes les inscriptions avec un numéro de licence
  FOR v_entry_record IN
    SELECT
      e.id as entry_id,
      e.athlete_id,
      a.license_number,
      a.first_name,
      a.last_name
    FROM entries e
    INNER JOIN athletes a ON e.athlete_id = a.id
    WHERE e.race_id = p_race_id
    AND a.license_number IS NOT NULL
    AND a.license_number != ''
  LOOP
    v_total := v_total + 1;

    -- Note: L'actualisation réelle se fera via l'API FFA côté client
    -- Ici on prépare juste la liste des licences à vérifier
    v_details := v_details || jsonb_build_object(
      'athlete_id', v_entry_record.athlete_id,
      'license_number', v_entry_record.license_number,
      'name', v_entry_record.first_name || ' ' || v_entry_record.last_name,
      'status', 'pending'
    );
  END LOOP;

  RETURN QUERY SELECT v_total, v_updated, v_errors, v_details;
END;
$$;

COMMENT ON FUNCTION refresh_ffa_licenses_for_race IS 'Prépare la liste des licences FFA à actualiser pour une course donnée';
