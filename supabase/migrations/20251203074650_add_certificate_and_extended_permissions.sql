/*
  # Ajout des permissions étendues pour les administrateurs

  1. Nouvelles permissions
    - Gestion des diplômes (certificats)
    - Gestion des résultats externes
    - Gestion des partenaires d'événements
    - Gestion des bénévoles
    - Gestion des speakers
    - Gestion du covoiturage
    - Gestion des échanges de dossards
    - Gestion des vidéos
    - Gestion des athlètes
    - Gestion des templates d'emails
    - Monitoring système

  2. Organisation par modules
    - Chaque fonctionnalité a ses permissions view/create/edit/delete
    - Permissions cohérentes avec l'interface admin
*/

-- Ajouter les nouvelles permissions
INSERT INTO admin_permissions (module, permission, label, description) VALUES
  -- Diplômes / Certificats
  ('certificates', 'view', 'Voir les diplômes', 'Consulter les templates de diplômes'),
  ('certificates', 'create', 'Créer des diplômes', 'Créer de nouveaux templates de diplômes'),
  ('certificates', 'edit', 'Modifier les diplômes', 'Modifier les templates existants'),
  ('certificates', 'delete', 'Supprimer les diplômes', 'Supprimer des templates de diplômes'),
  ('certificates', 'generate', 'Générer des diplômes', 'Générer des diplômes pour les participants'),

  -- Résultats externes
  ('external_results', 'view', 'Voir les résultats externes', 'Consulter les résultats externes'),
  ('external_results', 'create', 'Créer des résultats externes', 'Ajouter des événements externes'),
  ('external_results', 'edit', 'Modifier les résultats externes', 'Modifier les résultats externes'),
  ('external_results', 'delete', 'Supprimer les résultats externes', 'Supprimer des résultats externes'),
  ('external_results', 'import', 'Importer des résultats externes', 'Importer des fichiers de résultats'),

  -- Partenaires
  ('partners', 'view', 'Voir les partenaires', 'Consulter les partenaires d''événements'),
  ('partners', 'create', 'Créer des partenaires', 'Ajouter de nouveaux partenaires'),
  ('partners', 'edit', 'Modifier les partenaires', 'Modifier les partenaires existants'),
  ('partners', 'delete', 'Supprimer les partenaires', 'Supprimer des partenaires'),

  -- Bénévoles
  ('volunteers', 'view', 'Voir les bénévoles', 'Consulter les bénévoles'),
  ('volunteers', 'create', 'Créer des postes bénévoles', 'Créer des postes de bénévolat'),
  ('volunteers', 'edit', 'Modifier les bénévoles', 'Modifier les inscriptions bénévoles'),
  ('volunteers', 'delete', 'Supprimer les bénévoles', 'Supprimer des bénévoles'),

  -- Speakers (Commentateurs)
  ('speakers', 'view', 'Voir les speakers', 'Consulter les speakers'),
  ('speakers', 'create', 'Créer des speakers', 'Créer des comptes speakers'),
  ('speakers', 'edit', 'Modifier les speakers', 'Modifier les speakers'),
  ('speakers', 'delete', 'Supprimer les speakers', 'Supprimer des speakers'),

  -- Covoiturage
  ('carpooling', 'view', 'Voir le covoiturage', 'Consulter les offres de covoiturage'),
  ('carpooling', 'moderate', 'Modérer le covoiturage', 'Approuver/refuser les offres'),
  ('carpooling', 'delete', 'Supprimer des covoiturages', 'Supprimer des offres'),

  -- Échanges de dossards
  ('bib_exchange', 'view', 'Voir les échanges de dossards', 'Consulter les échanges'),
  ('bib_exchange', 'moderate', 'Modérer les échanges', 'Approuver/refuser les échanges'),
  ('bib_exchange', 'delete', 'Supprimer des échanges', 'Supprimer des échanges'),
  ('bib_exchange', 'settings', 'Gérer les paramètres', 'Configurer les dates d''ouverture'),

  -- Vidéos
  ('videos', 'view', 'Voir les vidéos', 'Consulter les vidéos'),
  ('videos', 'create', 'Créer des vidéos', 'Ajouter de nouvelles vidéos'),
  ('videos', 'edit', 'Modifier les vidéos', 'Modifier les vidéos existantes'),
  ('videos', 'delete', 'Supprimer des vidéos', 'Supprimer des vidéos'),

  -- Athlètes
  ('athletes', 'view', 'Voir les athlètes', 'Consulter les profils athlètes'),
  ('athletes', 'create', 'Créer des athlètes', 'Créer de nouveaux profils'),
  ('athletes', 'edit', 'Modifier les athlètes', 'Modifier les profils existants'),
  ('athletes', 'delete', 'Supprimer des athlètes', 'Supprimer des profils'),
  ('athletes', 'merge', 'Fusionner des athlètes', 'Fusionner des doublons'),

  -- Templates d'emails
  ('email_templates', 'view', 'Voir les templates d''emails', 'Consulter les templates'),
  ('email_templates', 'create', 'Créer des templates', 'Créer de nouveaux templates'),
  ('email_templates', 'edit', 'Modifier les templates', 'Modifier les templates existants'),
  ('email_templates', 'delete', 'Supprimer des templates', 'Supprimer des templates'),

  -- Variables d'emails
  ('email_variables', 'view', 'Voir les variables d''emails', 'Consulter les variables disponibles'),
  ('email_variables', 'create', 'Créer des variables', 'Créer de nouvelles variables'),
  ('email_variables', 'edit', 'Modifier les variables', 'Modifier les variables'),
  ('email_variables', 'delete', 'Supprimer des variables', 'Supprimer des variables'),

  -- Assets d'emails
  ('email_assets', 'view', 'Voir les assets d''emails', 'Consulter les images/assets'),
  ('email_assets', 'upload', 'Upload des assets', 'Télécharger de nouveaux assets'),
  ('email_assets', 'delete', 'Supprimer des assets', 'Supprimer des assets'),

  -- Monitoring
  ('monitoring', 'view', 'Voir le monitoring', 'Consulter les logs système'),
  ('monitoring', 'email', 'Voir les logs emails', 'Consulter l''historique des emails'),

  -- Audit
  ('audit', 'view', 'Voir les logs d''audit', 'Consulter l''historique des actions admin'),
  ('audit', 'export', 'Exporter les logs', 'Télécharger les logs d''audit'),

  -- Paniers (Carts)
  ('carts', 'view', 'Voir les paniers', 'Consulter les paniers en cours'),
  ('carts', 'manage', 'Gérer les paniers', 'Modifier/supprimer des paniers'),

  -- Homepage Features
  ('homepage', 'view', 'Voir les features homepage', 'Consulter les features'),
  ('homepage', 'edit', 'Modifier la homepage', 'Modifier les features de la homepage'),

  -- Footer
  ('footer', 'view', 'Voir le footer', 'Consulter la configuration du footer'),
  ('footer', 'edit', 'Modifier le footer', 'Modifier le footer du site'),

  -- Deployment
  ('deployment', 'view', 'Voir le déploiement', 'Consulter les infos de déploiement'),
  ('deployment', 'deploy', 'Déployer', 'Lancer un déploiement'),

  -- Project Tracking
  ('project', 'view', 'Voir le suivi projet', 'Consulter le suivi du projet'),
  ('project', 'edit', 'Modifier le suivi', 'Modifier les tâches du projet')

ON CONFLICT (module, permission) DO NOTHING;

-- Créer un rôle "Gestionnaire Événements" avec permissions étendues
INSERT INTO admin_roles (name, description, is_super_admin) VALUES
  ('Gestionnaire Événements', 'Gestion complète des événements, diplômes, résultats et partenaires', false),
  ('Modérateur', 'Modération du covoiturage, échanges de dossards et contenu utilisateur', false)
ON CONFLICT (name) DO NOTHING;

-- Fonction pour assigner toutes les permissions d'un module à un utilisateur
CREATE OR REPLACE FUNCTION assign_module_permissions(
  p_user_id uuid,
  p_module text,
  p_granted_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insérer toutes les permissions du module pour l'utilisateur
  INSERT INTO admin_user_permissions (user_id, permission_id, granted, granted_by)
  SELECT
    p_user_id,
    id,
    true,
    COALESCE(p_granted_by, auth.uid())
  FROM admin_permissions
  WHERE module = p_module
  ON CONFLICT (user_id, permission_id)
  DO UPDATE SET granted = true, granted_by = COALESCE(p_granted_by, auth.uid());
END;
$$;

-- Fonction pour obtenir tous les modules disponibles
CREATE OR REPLACE FUNCTION get_available_modules()
RETURNS TABLE (
  module text,
  permissions_count bigint,
  description text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ap.module,
    COUNT(*)::bigint as permissions_count,
    CASE ap.module
      WHEN 'dashboard' THEN 'Tableau de bord principal'
      WHEN 'events' THEN 'Gestion des événements'
      WHEN 'organizers' THEN 'Gestion des organisateurs'
      WHEN 'entries' THEN 'Gestion des inscriptions'
      WHEN 'results' THEN 'Gestion des résultats'
      WHEN 'certificates' THEN 'Gestion des diplômes'
      WHEN 'external_results' THEN 'Résultats externes'
      WHEN 'partners' THEN 'Partenaires d''événements'
      WHEN 'volunteers' THEN 'Gestion des bénévoles'
      WHEN 'speakers' THEN 'Gestion des speakers'
      WHEN 'carpooling' THEN 'Modération covoiturage'
      WHEN 'bib_exchange' THEN 'Échanges de dossards'
      WHEN 'videos' THEN 'Gestion des vidéos'
      WHEN 'athletes' THEN 'Gestion des athlètes'
      WHEN 'email' THEN 'Envoi d''emails'
      WHEN 'email_templates' THEN 'Templates d''emails'
      WHEN 'email_variables' THEN 'Variables d''emails'
      WHEN 'email_assets' THEN 'Assets d''emails'
      WHEN 'finance' THEN 'Gestion financière'
      WHEN 'carts' THEN 'Gestion des paniers'
      WHEN 'users' THEN 'Gestion des administrateurs'
      WHEN 'pages' THEN 'Pages de service'
      WHEN 'homepage' THEN 'Homepage'
      WHEN 'footer' THEN 'Configuration footer'
      WHEN 'settings' THEN 'Paramètres système'
      WHEN 'monitoring' THEN 'Monitoring système'
      WHEN 'audit' THEN 'Logs d''audit'
      WHEN 'backups' THEN 'Sauvegardes'
      WHEN 'deployment' THEN 'Déploiement'
      WHEN 'project' THEN 'Suivi projet'
      ELSE ap.module
    END as description
  FROM admin_permissions ap
  GROUP BY ap.module
  ORDER BY ap.module;
END;
$$;

COMMENT ON FUNCTION assign_module_permissions IS 'Assigne toutes les permissions d''un module à un utilisateur';
COMMENT ON FUNCTION get_available_modules IS 'Retourne la liste de tous les modules disponibles avec leur nombre de permissions';
