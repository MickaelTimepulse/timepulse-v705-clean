/*
  # Système de formulaires personnalisables

  1. Nouvelles tables
    - `custom_forms`
      - `id` (uuid, primary key)
      - `title` (text) - Titre du formulaire
      - `slug` (text, unique) - URL du formulaire
      - `description` (text) - Description
      - `success_message` (text) - Message après soumission
      - `recipient_emails` (text[]) - Liste des emails destinataires
      - `is_active` (boolean) - Formulaire actif ou non
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `custom_form_fields`
      - `id` (uuid, primary key)
      - `form_id` (uuid, foreign key) - Référence au formulaire
      - `label` (text) - Label du champ
      - `field_type` (text) - Type de champ (text, email, tel, textarea, select, checkbox, radio)
      - `options` (jsonb) - Options pour select/radio/checkbox
      - `is_required` (boolean) - Champ obligatoire
      - `display_order` (integer) - Ordre d'affichage
      - `placeholder` (text) - Texte d'aide
      - `created_at` (timestamptz)

    - `custom_form_submissions`
      - `id` (uuid, primary key)
      - `form_id` (uuid, foreign key)
      - `data` (jsonb) - Données soumises
      - `ip_address` (text) - IP du soumetteur
      - `user_agent` (text) - User agent
      - `submitted_at` (timestamptz)
      - `is_processed` (boolean) - Traité ou non
      - `processed_at` (timestamptz)
      - `notes` (text) - Notes internes

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour admin uniquement sur forms et fields
    - Policy publique pour soumettre un formulaire
    - Policy admin pour voir les soumissions
*/

-- Créer la table des formulaires
CREATE TABLE IF NOT EXISTS custom_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  success_message text DEFAULT 'Merci pour votre demande. Nous vous contacterons dans les plus brefs délais.',
  recipient_emails text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table des champs de formulaires
CREATE TABLE IF NOT EXISTS custom_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES custom_forms(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'email', 'tel', 'textarea', 'select', 'checkbox', 'radio', 'number')),
  options jsonb DEFAULT '[]'::jsonb,
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  placeholder text,
  created_at timestamptz DEFAULT now()
);

-- Créer la table des soumissions
CREATE TABLE IF NOT EXISTS custom_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES custom_forms(id) ON DELETE CASCADE NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  submitted_at timestamptz DEFAULT now(),
  is_processed boolean DEFAULT false,
  processed_at timestamptz,
  notes text
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_custom_form_fields_form_id ON custom_form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_custom_form_fields_order ON custom_form_fields(form_id, display_order);
CREATE INDEX IF NOT EXISTS idx_custom_form_submissions_form_id ON custom_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_custom_form_submissions_date ON custom_form_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_forms_slug ON custom_forms(slug);

-- Enable RLS
ALTER TABLE custom_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_form_submissions ENABLE ROW LEVEL SECURITY;

-- Policies pour custom_forms
-- Admin peut tout faire
CREATE POLICY "Admins can manage forms"
  ON custom_forms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Public peut lire les formulaires actifs
CREATE POLICY "Public can view active forms"
  ON custom_forms
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policies pour custom_form_fields
-- Admin peut tout faire
CREATE POLICY "Admins can manage form fields"
  ON custom_form_fields
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Public peut lire les champs des formulaires actifs
CREATE POLICY "Public can view fields of active forms"
  ON custom_form_fields
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM custom_forms
      WHERE custom_forms.id = custom_form_fields.form_id
      AND custom_forms.is_active = true
    )
  );

-- Policies pour custom_form_submissions
-- Admin peut tout voir et gérer
CREATE POLICY "Admins can manage submissions"
  ON custom_form_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Public peut soumettre des formulaires
CREATE POLICY "Public can submit forms"
  ON custom_form_submissions
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_forms
      WHERE custom_forms.id = custom_form_submissions.form_id
      AND custom_forms.is_active = true
    )
  );

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_custom_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_forms_updated_at
  BEFORE UPDATE ON custom_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_forms_updated_at();

-- Créer un formulaire de demande de devis par défaut
INSERT INTO custom_forms (title, slug, description, recipient_emails, is_active)
VALUES (
  'Demande de devis',
  'demande-de-devis',
  'Remplissez ce formulaire pour obtenir un devis personnalisé pour votre événement sportif.',
  ARRAY['mickael@timepulse.fr', 'leonard@timepulse.fr'],
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Ajouter des champs par défaut au formulaire de devis
DO $$
DECLARE
  form_id_var uuid;
BEGIN
  SELECT id INTO form_id_var FROM custom_forms WHERE slug = 'demande-de-devis';
  
  IF form_id_var IS NOT NULL THEN
    INSERT INTO custom_form_fields (form_id, label, field_type, is_required, display_order, placeholder) VALUES
      (form_id_var, 'Nom de l''organisateur', 'text', true, 1, 'Votre nom complet'),
      (form_id_var, 'Email', 'email', true, 2, 'votre@email.fr'),
      (form_id_var, 'Téléphone', 'tel', true, 3, '06 12 34 56 78'),
      (form_id_var, 'Nom de l''événement', 'text', true, 4, 'Ex: Marathon de Paris 2025'),
      (form_id_var, 'Type d''événement', 'select', true, 5, NULL),
      (form_id_var, 'Date de l''événement', 'text', true, 6, 'JJ/MM/AAAA'),
      (form_id_var, 'Nombre de participants attendus', 'select', true, 7, NULL),
      (form_id_var, 'Services souhaités', 'checkbox', true, 8, NULL),
      (form_id_var, 'Commentaires ou besoins spécifiques', 'textarea', false, 9, 'Décrivez vos besoins...')
    ON CONFLICT DO NOTHING;
    
    -- Mettre à jour les options pour les champs select et checkbox
    UPDATE custom_form_fields 
    SET options = '["Course sur route", "Trail", "Triathlon", "Swimrun", "Marche nordique", "Autre"]'::jsonb
    WHERE form_id = form_id_var AND label = 'Type d''événement';
    
    UPDATE custom_form_fields 
    SET options = '["Moins de 100", "100 à 500", "500 à 1000", "1000 à 3000", "Plus de 3000"]'::jsonb
    WHERE form_id = form_id_var AND label = 'Nombre de participants attendus';
    
    UPDATE custom_form_fields 
    SET options = '["Chronométrage électronique", "Inscriptions en ligne", "Gestion des résultats", "Affichage sur écrans géants", "Production vidéo", "Animation sonore", "Support logistique"]'::jsonb
    WHERE form_id = form_id_var AND label = 'Services souhaités';
  END IF;
END $$;
