-- ============================================================================
-- EXEMPLES D'ATTRIBUTION DE PERMISSIONS TIMEPULSE
-- ============================================================================
-- Ce fichier contient des exemples pratiques pour gérer les permissions
-- des administrateurs TimePulse
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VOIR TOUS LES MODULES DISPONIBLES
-- ----------------------------------------------------------------------------
SELECT * FROM get_available_modules();


-- ----------------------------------------------------------------------------
-- 2. VOIR TOUTES LES PERMISSIONS D'UN MODULE
-- ----------------------------------------------------------------------------
-- Exemple: Voir toutes les permissions du module "certificates"
SELECT
  id,
  module,
  permission,
  label,
  description
FROM admin_permissions
WHERE module = 'certificates'
ORDER BY permission;


-- ----------------------------------------------------------------------------
-- 3. CRÉER UN GESTIONNAIRE D'ÉVÉNEMENTS COMPLET
-- ----------------------------------------------------------------------------
-- Remplacer 'USER_UUID_ICI' par l'UUID de l'utilisateur
DO $$
DECLARE
  v_user_id uuid := 'USER_UUID_ICI'::uuid;
BEGIN
  -- Événements
  PERFORM assign_module_permissions(v_user_id, 'events');

  -- Inscriptions
  PERFORM assign_module_permissions(v_user_id, 'entries');

  -- Résultats
  PERFORM assign_module_permissions(v_user_id, 'results');

  -- Diplômes
  PERFORM assign_module_permissions(v_user_id, 'certificates');

  -- Partenaires
  PERFORM assign_module_permissions(v_user_id, 'partners');

  -- Bénévoles
  PERFORM assign_module_permissions(v_user_id, 'volunteers');

  -- Résultats externes
  PERFORM assign_module_permissions(v_user_id, 'external_results');

  RAISE NOTICE 'Permissions de gestionnaire événements attribuées avec succès';
END $$;


-- ----------------------------------------------------------------------------
-- 4. CRÉER UN MODÉRATEUR DE COMMUNAUTÉ
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id uuid := 'USER_UUID_ICI'::uuid;
BEGIN
  -- Covoiturage
  PERFORM assign_module_permissions(v_user_id, 'carpooling');

  -- Échanges de dossards
  PERFORM assign_module_permissions(v_user_id, 'bib_exchange');

  -- Vidéos
  PERFORM assign_module_permissions(v_user_id, 'videos');

  -- Voir les événements (lecture seule)
  INSERT INTO admin_user_permissions (user_id, permission_id, granted)
  SELECT v_user_id, id, true
  FROM admin_permissions
  WHERE module = 'events' AND permission = 'view'
  ON CONFLICT (user_id, permission_id) DO UPDATE SET granted = true;

  RAISE NOTICE 'Permissions de modérateur attribuées avec succès';
END $$;


-- ----------------------------------------------------------------------------
-- 5. CRÉER UN GESTIONNAIRE DE CONTENU
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id uuid := 'USER_UUID_ICI'::uuid;
BEGIN
  -- Pages
  PERFORM assign_module_permissions(v_user_id, 'pages');

  -- Homepage
  PERFORM assign_module_permissions(v_user_id, 'homepage');

  -- Footer
  PERFORM assign_module_permissions(v_user_id, 'footer');

  -- Vidéos
  PERFORM assign_module_permissions(v_user_id, 'videos');

  -- Templates d'emails
  PERFORM assign_module_permissions(v_user_id, 'email_templates');

  -- Variables d'emails
  PERFORM assign_module_permissions(v_user_id, 'email_variables');

  -- Assets d'emails
  PERFORM assign_module_permissions(v_user_id, 'email_assets');

  RAISE NOTICE 'Permissions de gestionnaire contenu attribuées avec succès';
END $$;


-- ----------------------------------------------------------------------------
-- 6. CRÉER UN COMPTABLE
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id uuid := 'USER_UUID_ICI'::uuid;
BEGIN
  -- Finance (toutes permissions)
  PERFORM assign_module_permissions(v_user_id, 'finance');

  -- Voir les événements (lecture seule)
  INSERT INTO admin_user_permissions (user_id, permission_id, granted)
  SELECT v_user_id, id, true
  FROM admin_permissions
  WHERE module = 'events' AND permission = 'view'
  ON CONFLICT (user_id, permission_id) DO UPDATE SET granted = true;

  -- Voir les inscriptions (lecture seule)
  INSERT INTO admin_user_permissions (user_id, permission_id, granted)
  SELECT v_user_id, id, true
  FROM admin_permissions
  WHERE module = 'entries' AND permission = 'view'
  ON CONFLICT (user_id, permission_id) DO UPDATE SET granted = true;

  -- Exporter les inscriptions
  INSERT INTO admin_user_permissions (user_id, permission_id, granted)
  SELECT v_user_id, id, true
  FROM admin_permissions
  WHERE module = 'entries' AND permission = 'export'
  ON CONFLICT (user_id, permission_id) DO UPDATE SET granted = true;

  -- Voir les paniers
  PERFORM assign_module_permissions(v_user_id, 'carts');

  RAISE NOTICE 'Permissions de comptable attribuées avec succès';
END $$;


-- ----------------------------------------------------------------------------
-- 7. CRÉER UN RESPONSABLE DIPLÔMES
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_user_id uuid := 'USER_UUID_ICI'::uuid;
BEGIN
  -- Diplômes (toutes permissions)
  PERFORM assign_module_permissions(v_user_id, 'certificates');

  -- Voir les événements
  INSERT INTO admin_user_permissions (user_id, permission_id, granted)
  SELECT v_user_id, id, true
  FROM admin_permissions
  WHERE module = 'events' AND permission = 'view'
  ON CONFLICT (user_id, permission_id) DO UPDATE SET granted = true;

  -- Voir les résultats
  INSERT INTO admin_user_permissions (user_id, permission_id, granted)
  SELECT v_user_id, id, true
  FROM admin_permissions
  WHERE module = 'results' AND permission = 'view'
  ON CONFLICT (user_id, permission_id) DO UPDATE SET granted = true;

  -- Assets d'emails (pour les logos)
  PERFORM assign_module_permissions(v_user_id, 'email_assets');

  RAISE NOTICE 'Permissions de responsable diplômes attribuées avec succès';
END $$;


-- ----------------------------------------------------------------------------
-- 8. VOIR LES PERMISSIONS D'UN UTILISATEUR
-- ----------------------------------------------------------------------------
-- Remplacer 'USER_UUID_ICI' par l'UUID de l'utilisateur
SELECT
  p.module,
  p.permission,
  p.label,
  p.description,
  up.granted,
  up.created_at,
  granted_by.email as granted_by_email
FROM admin_user_permissions up
JOIN admin_permissions p ON p.id = up.permission_id
JOIN admin_users au ON au.id = up.user_id
LEFT JOIN admin_users granted_by ON granted_by.id = up.granted_by
WHERE up.user_id = 'USER_UUID_ICI'::uuid
ORDER BY p.module, p.permission;


-- ----------------------------------------------------------------------------
-- 9. VOIR TOUS LES UTILISATEURS AVEC LEURS PERMISSIONS
-- ----------------------------------------------------------------------------
SELECT
  au.email,
  ar.name as role_name,
  COUNT(DISTINCT up.permission_id) as permissions_count,
  STRING_AGG(DISTINCT p.module, ', ' ORDER BY p.module) as modules
FROM admin_users au
LEFT JOIN admin_roles ar ON ar.id = au.role_id
LEFT JOIN admin_user_permissions up ON up.user_id = au.id AND up.granted = true
LEFT JOIN admin_permissions p ON p.id = up.permission_id
GROUP BY au.id, au.email, ar.name
ORDER BY au.email;


-- ----------------------------------------------------------------------------
-- 10. RÉVOQUER TOUTES LES PERMISSIONS D'UN MODULE
-- ----------------------------------------------------------------------------
-- Remplacer 'USER_UUID_ICI' et 'MODULE_NAME' par les valeurs appropriées
DELETE FROM admin_user_permissions
WHERE user_id = 'USER_UUID_ICI'::uuid
  AND permission_id IN (
    SELECT id FROM admin_permissions WHERE module = 'MODULE_NAME'
  );


-- ----------------------------------------------------------------------------
-- 11. RÉVOQUER UNE PERMISSION SPÉCIFIQUE
-- ----------------------------------------------------------------------------
-- Exemple: Révoquer la permission de supprimer des événements
DELETE FROM admin_user_permissions
WHERE user_id = 'USER_UUID_ICI'::uuid
  AND permission_id = (
    SELECT id FROM admin_permissions
    WHERE module = 'events' AND permission = 'delete'
  );


-- ----------------------------------------------------------------------------
-- 12. AJOUTER UNE PERMISSION UNIQUE
-- ----------------------------------------------------------------------------
-- Exemple: Ajouter uniquement la permission de générer des diplômes
INSERT INTO admin_user_permissions (user_id, permission_id, granted)
SELECT
  'USER_UUID_ICI'::uuid,
  id,
  true
FROM admin_permissions
WHERE module = 'certificates' AND permission = 'generate'
ON CONFLICT (user_id, permission_id)
DO UPDATE SET granted = true;


-- ----------------------------------------------------------------------------
-- 13. CLONER LES PERMISSIONS D'UN UTILISATEUR À UN AUTRE
-- ----------------------------------------------------------------------------
-- Copier toutes les permissions de USER_SOURCE vers USER_TARGET
INSERT INTO admin_user_permissions (user_id, permission_id, granted)
SELECT
  'USER_TARGET_UUID'::uuid,
  permission_id,
  granted
FROM admin_user_permissions
WHERE user_id = 'USER_SOURCE_UUID'::uuid
ON CONFLICT (user_id, permission_id)
DO UPDATE SET granted = EXCLUDED.granted;


-- ----------------------------------------------------------------------------
-- 14. AUDIT: VOIR QUI A ACCORDÉ QUELLES PERMISSIONS
-- ----------------------------------------------------------------------------
SELECT
  au.email as user_email,
  p.module,
  p.permission,
  p.label,
  granted_by.email as granted_by_email,
  up.created_at
FROM admin_user_permissions up
JOIN admin_users au ON au.id = up.user_id
JOIN admin_permissions p ON p.id = up.permission_id
LEFT JOIN admin_users granted_by ON granted_by.id = up.granted_by
WHERE up.granted = true
ORDER BY up.created_at DESC
LIMIT 50;


-- ----------------------------------------------------------------------------
-- 15. STATISTIQUES GLOBALES DES PERMISSIONS
-- ----------------------------------------------------------------------------
SELECT
  p.module,
  p.permission,
  COUNT(DISTINCT up.user_id) as users_with_permission
FROM admin_permissions p
LEFT JOIN admin_user_permissions up ON up.permission_id = p.id AND up.granted = true
GROUP BY p.module, p.permission
ORDER BY users_with_permission DESC, p.module, p.permission;


-- ----------------------------------------------------------------------------
-- 16. TROUVER LES UTILISATEURS SANS PERMISSIONS
-- ----------------------------------------------------------------------------
SELECT
  au.email,
  au.created_at,
  ar.name as role_name
FROM admin_users au
LEFT JOIN admin_roles ar ON ar.id = au.role_id
LEFT JOIN admin_user_permissions up ON up.user_id = au.id AND up.granted = true
WHERE up.id IS NULL
  AND ar.is_super_admin = false
ORDER BY au.created_at DESC;


-- ----------------------------------------------------------------------------
-- 17. PERMISSIONS PAR RÔLE (RECOMMANDÉES)
-- ----------------------------------------------------------------------------
-- Cette requête montre les permissions recommandées par rôle

-- Super Admin : Toutes les permissions (automatique)

-- Manager
COMMENT ON ROLE manager IS 'Permissions recommandées: events, organizers, entries, results, finance (view only), email (send)';

-- Support
COMMENT ON ROLE support IS 'Permissions recommandées: entries, email, carpooling (moderate), bib_exchange (moderate)';

-- Comptable
COMMENT ON ROLE comptable IS 'Permissions recommandées: finance, entries (view + export), carts';

-- Éditeur
COMMENT ON ROLE editeur IS 'Permissions recommandées: pages, homepage, footer, videos, email_templates, email_variables, email_assets';

-- Gestionnaire Événements
COMMENT ON ROLE gestionnaire IS 'Permissions recommandées: events, entries, results, certificates, partners, volunteers, external_results';

-- Modérateur
COMMENT ON ROLE moderateur IS 'Permissions recommandées: carpooling, bib_exchange, videos, events (view only)';


-- ============================================================================
-- FIN DES EXEMPLES
-- ============================================================================
