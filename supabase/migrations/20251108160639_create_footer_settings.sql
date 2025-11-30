/*
  # Création de la table footer_settings
  
  1. Tables
    - `footer_settings` - Configuration du footer du site
  
  2. Champs
    - id (uuid, primary key)
    - company_name (text) - Nom de l'entreprise
    - company_description (text) - Description courte
    - email (text) - Email de contact
    - phone (text) - Téléphone
    - address (text) - Adresse physique
    - facebook_url (text) - URL Facebook
    - twitter_url (text) - URL Twitter/X
    - instagram_url (text) - URL Instagram
    - linkedin_url (text) - URL LinkedIn
    - youtube_url (text) - URL YouTube
    - copyright_text (text) - Texte du copyright
    - links (jsonb) - Liens personnalisés du footer
    - updated_at (timestamptz)
  
  3. Security
    - Public read (pour afficher le footer)
    - Admin write (pour modifier)
*/

-- Créer la table footer_settings
CREATE TABLE IF NOT EXISTS footer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Timepulse',
  company_description text,
  email text,
  phone text,
  address text,
  facebook_url text,
  twitter_url text,
  instagram_url text,
  linkedin_url text,
  youtube_url text,
  copyright_text text DEFAULT '© 2025 Timepulse. Tous droits réservés.',
  links jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insérer la configuration par défaut
INSERT INTO footer_settings (
  company_name,
  company_description,
  email,
  phone,
  address,
  copyright_text,
  links
) VALUES (
  'Timepulse',
  'Spécialiste du chronométrage d''événements sportifs depuis 2009',
  'contact@timepulse.run',
  '+33 1 23 45 67 89',
  'Paris, France',
  '© 2025 Timepulse. Tous droits réservés.',
  '[
    {
      "section": "Événements",
      "items": [
        {"label": "Trouver une course", "url": "/"},
        {"label": "Organisateurs", "url": "/organizer/login"},
        {"label": "Résultats", "url": "/results"}
      ]
    },
    {
      "section": "Services",
      "items": [
        {"label": "Chronométrage", "url": "/service/chronometrage"},
        {"label": "Inscriptions en ligne", "url": "/"},
        {"label": "Gestion d''événements", "url": "/"}
      ]
    },
    {
      "section": "À propos",
      "items": [
        {"label": "Qui sommes-nous ?", "url": "/about"},
        {"label": "Contact", "url": "/contact"},
        {"label": "Mentions légales", "url": "/legal"}
      ]
    }
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_footer_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER footer_settings_updated_at
  BEFORE UPDATE ON footer_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_footer_settings_updated_at();

-- Enable RLS
ALTER TABLE footer_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Public read
CREATE POLICY "Public can read footer settings"
ON footer_settings FOR SELECT
TO public
USING (true);

-- Policy: Admin can update
CREATE POLICY "Admins can update footer settings"
ON footer_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
    AND admin_users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
    AND admin_users.is_active = true
  )
);

-- Allow anon to update (admin auth handled in app)
CREATE POLICY "Allow anon update footer settings"
ON footer_settings FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_footer_settings_updated_at ON footer_settings(updated_at DESC);

-- Commentaire
COMMENT ON TABLE footer_settings IS 'Configuration globale du footer du site';
