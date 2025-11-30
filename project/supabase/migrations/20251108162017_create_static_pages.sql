/*
  # Création du système de pages statiques (CMS)
  
  1. Tables
    - `static_pages` - Pages statiques du site (À propos, Contact, Mentions légales, etc.)
  
  2. Champs
    - id (uuid, primary key)
    - title (text) - Titre de la page
    - slug (text, unique) - URL de la page (ex: qui-sommes-nous)
    - content (text) - Contenu HTML de la page
    - meta_title (text) - Titre SEO
    - meta_description (text) - Description SEO
    - is_published (boolean) - Page publiée ou brouillon
    - show_in_footer (boolean) - Afficher dans le footer
    - show_in_header (boolean) - Afficher dans le header
    - display_order (integer) - Ordre d'affichage
    - created_at, updated_at
  
  3. Security
    - Public read (pour afficher les pages)
    - Admin write (pour modifier)
*/

-- Créer la table static_pages
CREATE TABLE IF NOT EXISTS static_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  meta_title text,
  meta_description text,
  is_published boolean DEFAULT false,
  show_in_footer boolean DEFAULT false,
  show_in_header boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insérer les pages par défaut
INSERT INTO static_pages (title, slug, content, meta_title, meta_description, is_published, show_in_footer, display_order) VALUES
(
  'Qui sommes-nous ?',
  'qui-sommes-nous',
  '<h1>Qui sommes-nous ?</h1>
<p>Timepulse est une entreprise spécialisée dans le chronométrage d''événements sportifs depuis 2009.</p>
<h2>Notre expertise</h2>
<p>Nous proposons des solutions complètes pour les organisateurs d''événements sportifs :</p>
<ul>
<li>Chronométrage électronique professionnel</li>
<li>Inscriptions en ligne</li>
<li>Gestion des résultats en temps réel</li>
<li>Diffusion sur écrans géants</li>
</ul>
<h2>Notre mission</h2>
<p>Faciliter l''organisation d''événements sportifs et offrir la meilleure expérience aux participants.</p>',
  'À propos de Timepulse - Chronométrage sportif',
  'Découvrez Timepulse, spécialiste du chronométrage et des inscriptions en ligne pour événements sportifs depuis 2009.',
  true,
  true,
  1
),
(
  'Contact',
  'contact',
  '<h1>Contactez-nous</h1>
<h2>Informations de contact</h2>
<p><strong>Email :</strong> contact@timepulse.run</p>
<p><strong>Téléphone :</strong> +33 1 23 45 67 89</p>
<p><strong>Adresse :</strong> Paris, France</p>
<h2>Horaires d''ouverture</h2>
<p>Du lundi au vendredi : 9h00 - 18h00</p>
<h2>Nous écrire</h2>
<p>Pour toute demande d''information ou devis, n''hésitez pas à nous contacter par email ou téléphone.</p>',
  'Contact Timepulse - Nous contacter',
  'Contactez Timepulse pour vos événements sportifs. Email, téléphone et coordonnées.',
  true,
  true,
  2
),
(
  'Mentions légales',
  'mentions-legales',
  '<h1>Mentions légales</h1>
<h2>Éditeur du site</h2>
<p><strong>Raison sociale :</strong> Timepulse</p>
<p><strong>Siège social :</strong> Paris, France</p>
<p><strong>Email :</strong> contact@timepulse.run</p>
<h2>Hébergement</h2>
<p><strong>Hébergeur :</strong> Vercel Inc.<br>
340 S Lemon Ave #4133<br>
Walnut, CA 91789, USA</p>
<h2>Propriété intellectuelle</h2>
<p>Le contenu de ce site (textes, images, graphismes, logo, etc.) est la propriété exclusive de Timepulse.</p>
<h2>Données personnelles</h2>
<p>Conformément au RGPD, vous disposez d''un droit d''accès, de rectification et de suppression de vos données personnelles.</p>',
  'Mentions légales - Timepulse',
  'Mentions légales du site Timepulse. Informations sur l''éditeur, l''hébergeur et les données personnelles.',
  true,
  true,
  3
),
(
  'Politique de confidentialité',
  'politique-confidentialite',
  '<h1>Politique de confidentialité</h1>
<h2>Collecte des données</h2>
<p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
<ul>
<li>Nom et prénom</li>
<li>Adresse email</li>
<li>Numéro de téléphone</li>
<li>Informations de paiement (sécurisées)</li>
</ul>
<h2>Utilisation des données</h2>
<p>Vos données sont utilisées pour :</p>
<ul>
<li>Gérer vos inscriptions aux événements</li>
<li>Vous envoyer les confirmations et informations importantes</li>
<li>Améliorer nos services</li>
</ul>
<h2>Protection des données</h2>
<p>Nous mettons en œuvre toutes les mesures techniques et organisationnelles pour protéger vos données personnelles.</p>
<h2>Vos droits</h2>
<p>Vous pouvez à tout moment exercer vos droits d''accès, de rectification, d''opposition et de suppression en nous contactant à : contact@timepulse.run</p>',
  'Politique de confidentialité - Timepulse',
  'Politique de confidentialité et protection des données personnelles sur Timepulse.',
  true,
  true,
  4
),
(
  'CGV - Conditions Générales de Vente',
  'cgv',
  '<h1>Conditions Générales de Vente</h1>
<h2>Article 1 - Objet</h2>
<p>Les présentes conditions générales de vente régissent les relations entre Timepulse et ses clients.</p>
<h2>Article 2 - Prix</h2>
<p>Les prix sont indiqués en euros TTC. Ils incluent les frais de gestion.</p>
<h2>Article 3 - Paiement</h2>
<p>Le paiement s''effectue en ligne par carte bancaire de manière sécurisée.</p>
<h2>Article 4 - Droit de rétractation</h2>
<p>Conformément à l''article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les prestations de services d''activités de loisirs fournis à une date déterminée.</p>
<h2>Article 5 - Réclamations</h2>
<p>Pour toute réclamation, contactez-nous à : contact@timepulse.run</p>',
  'CGV - Conditions Générales de Vente - Timepulse',
  'Conditions générales de vente de Timepulse. Prix, paiement, droit de rétractation.',
  true,
  true,
  5
)
ON CONFLICT (slug) DO NOTHING;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_static_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER static_pages_updated_at
  BEFORE UPDATE ON static_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_static_pages_updated_at();

-- Enable RLS
ALTER TABLE static_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read published pages
CREATE POLICY "Public can read published static pages"
ON static_pages FOR SELECT
TO public
USING (is_published = true);

-- Policy: Admin can do everything
CREATE POLICY "Admins can manage static pages"
ON static_pages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
    AND admin_users.is_active = true
  )
);

-- Allow anon to manage (admin auth handled in app)
CREATE POLICY "Allow anon manage static pages"
ON static_pages FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_static_pages_slug ON static_pages(slug);
CREATE INDEX IF NOT EXISTS idx_static_pages_published ON static_pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_static_pages_order ON static_pages(display_order);

-- Commentaire
COMMENT ON TABLE static_pages IS 'Pages statiques du site (CMS)';
