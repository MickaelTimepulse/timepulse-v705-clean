/*
  # Mise à jour de la fonction admin pour inclure les champs FFA étendus

  1. Modifications
    - Ajout de ffa_relcod (type de licence FFA code)
    - Ajout de ffa_club_code (numéro du club maître)
    - Ajout de ffa_league_abbr (libellé abrégé ligue)
    - Ajout de ffa_department_abbr (libellé abrégé département)
*/

DROP FUNCTION IF EXISTS admin_get_all_entries(uuid);

CREATE OR REPLACE FUNCTION admin_get_all_entries(p_event_id uuid)
RETURNS TABLE (
  entry_id uuid,
  bib_number text,
  race_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  birth_date date,
  gender text,
  nationality text,
  city text,
  postal_code text,
  club text,
  license_number text,
  license_type_name text,
  federation text,
  ffa_relcod text,
  ffa_club_code text,
  ffa_league_abbr text,
  ffa_department_abbr text,
  category text,
  registration_status text,
  payment_status text,
  amount numeric,
  registration_date timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  RETURN QUERY
  SELECT 
    e.id as entry_id,
    e.bib_number::text,
    r.name as race_name,
    a.first_name,
    a.last_name,
    a.email,
    a.phone,
    a.birth_date,
    a.gender,
    a.nationality,
    a.city,
    a.postal_code,
    a.club,
    a.license_number,
    lt.name as license_type_name,
    lt.federation,
    a.ffa_relcod,
    a.ffa_club_code,
    a.ffa_league_abbr,
    a.ffa_department_abbr,
    e.category,
    e.registration_status,
    e.payment_status,
    e.amount,
    e.registration_date,
    e.created_at
  FROM entries e
  INNER JOIN races r ON e.race_id = r.id
  INNER JOIN athletes a ON e.athlete_id = a.id
  LEFT JOIN license_types lt ON a.license_type::uuid = lt.id
  WHERE r.event_id = p_event_id
  ORDER BY e.created_at DESC;
END;
$$;
