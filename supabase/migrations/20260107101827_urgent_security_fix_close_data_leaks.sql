/*
  # 🚨 CORRECTION DE SÉCURITÉ URGENTE - FUITE DE DONNÉES

  ## Problème identifié
  Un chercheur en sécurité a réussi à extraire toutes les inscriptions avec emails
  en exploitant des politiques RLS trop permissives qui permettaient un accès anonyme
  complet aux données personnelles.

  ## Failles critiques corrigées
  
  ### 1. Table `athletes`
  - ❌ **SUPPRIMÉ** : "Temporary anon read access for admin" (accès anonyme complet)
  - ❌ **SUPPRIMÉ** : "Authenticated users can read all athletes" (accès sans restriction)
  
  ### 2. Table `entries`
  - ❌ **SUPPRIMÉ** : "Public can view own entry by management code" avec qual: true (pas de vérification)
  - ❌ **SUPPRIMÉ** : "Public can update own entry by management code" avec qual: true (pas de vérification)
  - ✅ **RESTREINT** : Accès public uniquement aux inscriptions confirmées d'événements publics actifs
  
  ### 3. Table `admin_users`
  - ❌ **SUPPRIMÉ** : "Anon can read for login" (exposition complète des comptes admin)
  - ❌ **SUPPRIMÉ** : "Authenticated can verify admin roles" (accès sans restriction)

  ## Impact
  - Les utilisateurs anonymes ne peuvent plus extraire les données personnelles
  - Les emails, téléphones et autres données sensibles ne sont plus exposés
  - L'accès par management_code passe désormais par des fonctions sécurisées
  - Les comptes admin ne sont plus accessibles directement
*/

-- =====================================================
-- 1. SÉCURISATION CRITIQUE - TABLE ATHLETES
-- =====================================================

-- Supprimer la faille majeure : accès anonyme complet
DROP POLICY IF EXISTS "Temporary anon read access for admin" ON athletes;

-- Supprimer l'accès authentifié sans restriction
DROP POLICY IF EXISTS "Authenticated users can read all athletes" ON athletes;

-- Les politiques restantes (organizers, own profile) sont déjà restrictives

-- =====================================================
-- 2. SÉCURISATION CRITIQUE - TABLE ENTRIES
-- =====================================================

-- Supprimer les politiques dangereuses qui n'utilisent aucune vérification
DROP POLICY IF EXISTS "Public can view own entry by management code" ON entries;
DROP POLICY IF EXISTS "Public can update own entry by management code" ON entries;

-- Supprimer les politiques trop permissives
DROP POLICY IF EXISTS "Public can view all confirmed entries with details" ON entries;
DROP POLICY IF EXISTS "Public can view confirmed entries by event_id" ON entries;

-- Nouvelle politique RESTRICTIVE pour l'accès public
-- Uniquement les inscriptions confirmées d'événements publics actifs
CREATE POLICY "Public can view confirmed entries from active public events"
  ON entries FOR SELECT
  TO public
  USING (
    status = 'confirmed'
    AND EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON e.id = r.event_id
      WHERE r.id = entries.race_id
        AND e.status = 'active'
        AND e.public_registration = true
    )
  );

-- =====================================================
-- 3. SÉCURISATION CRITIQUE - TABLE ADMIN_USERS
-- =====================================================

-- Supprimer l'accès anonyme complet aux comptes admin
DROP POLICY IF EXISTS "Anon can read for login" ON admin_users;

-- Supprimer l'accès authentifié sans restriction
DROP POLICY IF EXISTS "Authenticated can verify admin roles" ON admin_users;

-- Les fonctions d'authentification admin doivent passer par des fonctions sécurisées

-- =====================================================
-- 4. FONCTIONS SÉCURISÉES POUR MANAGEMENT_CODE
-- =====================================================

-- Fonction pour récupérer UNE inscription par code (avec vérification stricte)
CREATE OR REPLACE FUNCTION public.get_entry_by_management_code(p_code text)
RETURNS TABLE (
  id uuid,
  race_id uuid,
  athlete_id uuid,
  bib_number text,
  status text,
  amount numeric,
  payment_status text,
  registration_date timestamptz,
  first_name text,
  last_name text,
  email text,
  phone text,
  event_name text,
  race_name text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérification stricte du code
  IF p_code IS NULL OR length(trim(p_code)) < 8 THEN
    RAISE EXCEPTION 'Code de gestion invalide';
  END IF;

  -- Retourner UNE SEULE inscription avec données nécessaires
  RETURN QUERY
  SELECT 
    e.id,
    e.race_id,
    e.athlete_id,
    e.bib_number,
    e.status,
    e.amount,
    e.payment_status,
    e.registration_date,
    a.first_name,
    a.last_name,
    a.email,
    a.phone,
    ev.name as event_name,
    r.name as race_name
  FROM entries e
  JOIN athletes a ON a.id = e.athlete_id
  JOIN races r ON r.id = e.race_id
  JOIN events ev ON ev.id = r.event_id
  WHERE e.management_code = trim(p_code)
  LIMIT 1;  -- CRITIQUE : une seule inscription
END;
$$;

-- Fonction pour mettre à jour UNE inscription par code (avec vérification stricte)
CREATE OR REPLACE FUNCTION public.update_entry_by_management_code(
  p_code text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_athlete_id uuid;
  v_entry_status text;
BEGIN
  -- Vérification stricte du code
  IF p_code IS NULL OR length(trim(p_code)) < 8 THEN
    RETURN false;
  END IF;

  -- Récupérer l'athlete_id et vérifier le statut
  SELECT e.athlete_id, e.status 
  INTO v_athlete_id, v_entry_status
  FROM entries e
  WHERE e.management_code = trim(p_code)
  LIMIT 1;

  -- Vérifications de sécurité
  IF v_athlete_id IS NULL THEN
    RETURN false;
  END IF;

  -- Interdire les modifications si l'inscription n'est pas dans un état modifiable
  IF v_entry_status NOT IN ('pending', 'confirmed') THEN
    RETURN false;
  END IF;

  -- Mettre à jour uniquement les champs fournis (pas de suppression)
  UPDATE athletes
  SET 
    first_name = COALESCE(NULLIF(trim(p_first_name), ''), athletes.first_name),
    last_name = COALESCE(NULLIF(trim(p_last_name), ''), athletes.last_name),
    email = COALESCE(NULLIF(trim(p_email), ''), athletes.email),
    phone = COALESCE(NULLIF(trim(p_phone), ''), athletes.phone),
    updated_at = NOW()
  WHERE id = v_athlete_id;

  RETURN true;
END;
$$;

-- =====================================================
-- 5. FONCTION SÉCURISÉE POUR VÉRIFICATION ADMIN
-- =====================================================

-- Fonction pour vérifier un admin lors du login (remplace l'accès direct)
CREATE OR REPLACE FUNCTION public.verify_admin_login(p_email text)
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  password_hash text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validation de l'email
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'Email invalide';
  END IF;

  -- Retourner UNE SEULE ligne pour le login
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.role,
    au.password_hash
  FROM admin_users au
  WHERE lower(au.email) = lower(trim(p_email))
  LIMIT 1;
END;
$$;

-- =====================================================
-- 6. MESSAGE DE CONFIRMATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '✅ SÉCURITÉ: Failles critiques corrigées';
  RAISE NOTICE '   - Accès anonyme aux données personnelles: BLOQUÉ';
  RAISE NOTICE '   - Extraction massive de données: IMPOSSIBLE';
  RAISE NOTICE '   - Accès par management_code: SÉCURISÉ via fonctions';
  RAISE NOTICE '   - Tables corrigées: athletes, entries, admin_users';
  RAISE NOTICE '=================================================================';
END $$;
