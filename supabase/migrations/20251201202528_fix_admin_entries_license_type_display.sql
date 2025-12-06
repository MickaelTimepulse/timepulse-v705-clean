/*
  # Corriger l'affichage du type de licence dans admin_get_all_entries

  1. Modifications
    - Gérer les cas où license_type est un texte court (LOISR, COMP, FFA, PPS)
    - Gérer les cas où license_type est un UUID
    - Afficher un nom lisible dans tous les cas
*/

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS admin_get_all_entries();

-- Recréer avec gestion des deux formats
CREATE OR REPLACE FUNCTION admin_get_all_entries()
RETURNS TABLE (
  id uuid,
  race_id uuid,
  event_id uuid,
  event_organizer_id uuid,
  event_name text,
  event_city text,
  race_name text,
  bib_number integer,
  first_name text,
  last_name text,
  gender text,
  birthdate date,
  email text,
  phone_mobile text,
  nationality_code text,
  license_number text,
  club text,
  category text,
  status text,
  amount numeric,
  paid_at timestamptz,
  refund_status text,
  refund_amount numeric,
  created_at timestamptz,
  registration_date timestamptz,
  management_code text,
  license_type text,
  license_type_code text,
  pps_number text,
  pps_expiry_date date
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.race_id,
    ev.id as event_id,
    ev.organizer_id as event_organizer_id,
    ev.name::text as event_name,
    ev.city::text as event_city,
    r.name::text as race_name,
    e.bib_number,
    a.first_name::text,
    a.last_name::text,
    a.gender::text,
    a.birthdate,
    a.email::text,
    a.phone::text as phone_mobile,
    a.nationality::text as nationality_code,
    COALESCE(a.license_number, a.license_id)::text as license_number,
    a.license_club::text as club,
    e.category::text,
    e.status::text,
    e.amount,
    e.paid_at,
    COALESCE(e.refund_status, 'none')::text,
    COALESCE(e.refund_amount, 0),
    e.created_at,
    e.registration_date,
    e.management_code::text,
    -- Gestion intelligente du type de licence
    CASE 
      -- Si c'est un UUID, récupérer le nom depuis license_types
      WHEN a.license_type ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
      THEN COALESCE(lt.name, a.license_type)
      -- Si c'est un code court, l'afficher tel quel
      ELSE a.license_type
    END::text as license_type,
    COALESCE(lt.code, a.license_type)::text as license_type_code,
    e.pps_number::text,
    e.pps_expiry_date
  FROM entries e
  JOIN races r ON r.id = e.race_id
  JOIN events ev ON ev.id = r.event_id
  JOIN athletes a ON a.id = e.athlete_id
  LEFT JOIN license_types lt ON lt.id::text = a.license_type
  ORDER BY e.registration_date DESC;
END;
$$;
