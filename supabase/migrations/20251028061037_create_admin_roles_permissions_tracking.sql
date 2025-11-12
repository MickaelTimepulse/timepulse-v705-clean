/*
  # Create Admin Roles, Permissions and Activity Tracking

  1. New Tables
    - `admin_roles` - Predefined roles (Super Admin, Manager, Support, etc.)
    - `admin_permissions` - Granular permissions for each module
    - `admin_user_permissions` - Custom permissions per user
    - `admin_login_sessions` - Track login/logout and time spent
    - `admin_activity_logs` - Detailed logs of all admin actions

  2. Security
    - Enable RLS on all tables
    - Only super admins can manage users and permissions
*/

-- Admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Add role_id to admin_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN role_id uuid REFERENCES admin_roles(id);
  END IF;
END $$;

-- Admin permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  permission text NOT NULL,
  label text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(module, permission)
);

ALTER TABLE admin_permissions ENABLE ROW LEVEL SECURITY;

-- Admin user permissions
CREATE TABLE IF NOT EXISTS admin_user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES admin_permissions(id) ON DELETE CASCADE,
  granted boolean DEFAULT true,
  granted_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

ALTER TABLE admin_user_permissions ENABLE ROW LEVEL SECURITY;

-- Admin login sessions (for time tracking)
CREATE TABLE IF NOT EXISTS admin_login_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  logged_in_at timestamptz DEFAULT now(),
  logged_out_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_login_sessions ENABLE ROW LEVEL SECURITY;

-- Admin activity logs
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  action text NOT NULL,
  module text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Insert default roles
INSERT INTO admin_roles (name, description, is_super_admin) VALUES
  ('Super Admin', 'Accès complet à toutes les fonctionnalités', true),
  ('Manager', 'Gestion des événements et organisateurs', false),
  ('Support', 'Support client et gestion des inscriptions', false),
  ('Comptable', 'Accès finance et commissions uniquement', false),
  ('Éditeur', 'Gestion du contenu et des pages', false)
ON CONFLICT (name) DO NOTHING;

-- Insert all available permissions
INSERT INTO admin_permissions (module, permission, label, description) VALUES
  ('dashboard', 'view', 'Voir le tableau de bord', 'Accès au dashboard principal'),
  ('events', 'view', 'Voir les événements', 'Consulter la liste des événements'),
  ('events', 'create', 'Créer des événements', 'Créer de nouveaux événements'),
  ('events', 'edit', 'Modifier les événements', 'Modifier les événements existants'),
  ('events', 'delete', 'Supprimer les événements', 'Supprimer des événements'),
  ('organizers', 'view', 'Voir les organisateurs', 'Consulter la liste des organisateurs'),
  ('organizers', 'create', 'Créer des organisateurs', 'Créer de nouveaux organisateurs'),
  ('organizers', 'edit', 'Modifier les organisateurs', 'Modifier les organisateurs'),
  ('organizers', 'delete', 'Supprimer les organisateurs', 'Supprimer des organisateurs'),
  ('entries', 'view', 'Voir les inscriptions', 'Consulter les inscriptions'),
  ('entries', 'edit', 'Modifier les inscriptions', 'Modifier les inscriptions'),
  ('entries', 'delete', 'Supprimer les inscriptions', 'Supprimer des inscriptions'),
  ('entries', 'export', 'Exporter les inscriptions', 'Télécharger les données'),
  ('results', 'view', 'Voir les résultats', 'Consulter les résultats'),
  ('results', 'import', 'Importer les résultats', 'Importer des fichiers de résultats'),
  ('results', 'edit', 'Modifier les résultats', 'Modifier les résultats'),
  ('results', 'delete', 'Supprimer les résultats', 'Supprimer des résultats'),
  ('finance', 'view', 'Voir les finances', 'Consulter les données financières'),
  ('finance', 'manage', 'Gérer les commissions', 'Modifier les taux de commission'),
  ('finance', 'export', 'Exporter les finances', 'Télécharger les rapports financiers'),
  ('email', 'view', 'Voir les emails', 'Consulter l''historique des emails'),
  ('email', 'send', 'Envoyer des emails', 'Envoyer des emails aux participants'),
  ('settings', 'view', 'Voir les paramètres', 'Consulter les paramètres'),
  ('settings', 'edit', 'Modifier les paramètres', 'Modifier les paramètres système'),
  ('users', 'view', 'Voir les utilisateurs admin', 'Consulter les utilisateurs admin'),
  ('users', 'create', 'Créer des utilisateurs', 'Créer de nouveaux admins'),
  ('users', 'edit', 'Modifier les utilisateurs', 'Modifier les permissions'),
  ('users', 'delete', 'Supprimer des utilisateurs', 'Supprimer des admins'),
  ('pages', 'view', 'Voir les pages', 'Consulter les pages de service'),
  ('pages', 'edit', 'Modifier les pages', 'Modifier les pages de service'),
  ('backups', 'view', 'Voir les sauvegardes', 'Consulter les sauvegardes'),
  ('backups', 'create', 'Créer des sauvegardes', 'Lancer une sauvegarde'),
  ('backups', 'restore', 'Restaurer des sauvegardes', 'Restaurer une sauvegarde')
ON CONFLICT (module, permission) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_login_sessions_user_id ON admin_login_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_login_sessions_logged_in_at ON admin_login_sessions(logged_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_user_id ON admin_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_module ON admin_activity_logs(module);
CREATE INDEX IF NOT EXISTS idx_admin_user_permissions_user_id ON admin_user_permissions(user_id);
