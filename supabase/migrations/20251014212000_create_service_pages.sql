/*
  # Service Pages for Timepulse

  1. New Tables
    - `service_pages`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - URL slug (e.g., "chronometrage")
      - `title` (text) - Page title
      - `icon` (text) - Lucide icon name
      - `short_description` (text) - Description shown in card
      - `hero_title` (text) - Hero section title
      - `hero_subtitle` (text) - Hero section subtitle
      - `hero_image_url` (text) - Hero image
      - `content` (jsonb) - Page content sections
      - `seo_title` (text) - SEO title
      - `seo_description` (text) - SEO description
      - `is_published` (boolean) - Published status
      - `order_index` (integer) - Display order on homepage
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `service_pages` table
    - Public read access for published pages
    - Admin-only write access
*/

CREATE TABLE IF NOT EXISTS service_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- URL & Identity
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'circle',

  -- Card display (homepage)
  short_description TEXT NOT NULL,
  card_image_url TEXT,

  -- Hero section
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT,
  hero_image_url TEXT,

  -- Page content (flexible JSON structure)
  content JSONB DEFAULT '[]'::jsonb,

  -- SEO
  seo_title TEXT,
  seo_description TEXT,

  -- Publishing
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_service_pages_slug ON service_pages(slug);
CREATE INDEX idx_service_pages_published ON service_pages(is_published) WHERE is_published = true;
CREATE INDEX idx_service_pages_order ON service_pages(order_index);

-- Updated at trigger
CREATE TRIGGER service_pages_updated_at
BEFORE UPDATE ON service_pages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE service_pages ENABLE ROW LEVEL SECURITY;

-- Public can read published pages
CREATE POLICY "Public can view published service pages"
  ON service_pages
  FOR SELECT
  USING (is_published = true);

-- Admins can manage all pages
CREATE POLICY "Admins can manage service pages"
  ON service_pages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('admin', 'super_admin')
    )
  );

-- Insert default service pages
INSERT INTO service_pages (slug, title, icon, short_description, hero_title, hero_subtitle, is_published, order_index, content) VALUES
(
  'chronometrage',
  'Chronométrage professionnel',
  'timer',
  'Expert en chronométrage électronique depuis 2009, pour des résultats précis et fiables.',
  'Chronométrage professionnel de haute précision',
  'Technologie RFID de pointe, résultats en temps réel et fiabilité garantie pour vos événements sportifs',
  true,
  1,
  '[
    {
      "type": "section",
      "title": "Notre expertise",
      "content": "<p>Depuis 2009, Timepulse est reconnu pour son savoir-faire en chronométrage électronique. Nous équipons les plus grands événements sportifs français avec une technologie de pointe.</p>"
    },
    {
      "type": "features",
      "title": "Nos solutions de chronométrage",
      "items": [
        {
          "icon": "zap",
          "title": "Puces RFID passives",
          "description": "Technologie éprouvée, fiable et économique pour tous types d''événements"
        },
        {
          "icon": "radio",
          "title": "Tapis de détection",
          "description": "Détection ultra-précise au centième de seconde à chaque point de passage"
        },
        {
          "icon": "monitor",
          "title": "Résultats en direct",
          "description": "Affichage live des classements sur écrans géants et site web"
        },
        {
          "icon": "shield-check",
          "title": "Redondance totale",
          "description": "Systèmes doublés pour une fiabilité absolue le jour J"
        }
      ]
    },
    {
      "type": "section",
      "title": "Nos références",
      "content": "<p>Plus de <strong>500 événements chronométrés</strong> et <strong>200 000 participants</strong> font confiance à Timepulse chaque année.</p>"
    }
  ]'::jsonb
),
(
  'inscriptions',
  'Inscriptions simplifiées',
  'user-plus',
  'Processus d''inscription rapide et intuitif, optimisé pour mobile et desktop.',
  'Plateforme d''inscriptions moderne et intuitive',
  'Offrez à vos participants une expérience d''inscription fluide et sécurisée',
  true,
  2,
  '[
    {
      "type": "section",
      "title": "Simplifiez vos inscriptions",
      "content": "<p>Notre plateforme d''inscription en ligne permet à vos participants de s''inscrire en quelques clics, depuis n''importe quel appareil.</p>"
    },
    {
      "type": "features",
      "title": "Fonctionnalités clés",
      "items": [
        {
          "icon": "smartphone",
          "title": "Mobile-first",
          "description": "Interface optimisée pour une inscription rapide sur mobile"
        },
        {
          "icon": "credit-card",
          "title": "Paiement sécurisé",
          "description": "Transactions sécurisées avec les standards bancaires"
        },
        {
          "icon": "users",
          "title": "Gestion des jauges",
          "description": "Quotas automatiques et liste d''attente intelligente"
        },
        {
          "icon": "mail",
          "title": "Confirmations auto",
          "description": "Emails de confirmation et rappels automatiques"
        }
      ]
    }
  ]'::jsonb
),
(
  'resultats',
  'Résultats en direct',
  'trending-up',
  'Suivez les performances en temps réel pendant les courses avec notre système de chronométrage.',
  'Résultats live pour une expérience immersive',
  'Offrez à vos spectateurs et participants un suivi en temps réel des performances',
  true,
  3,
  '[
    {
      "type": "section",
      "title": "Performance en direct",
      "content": "<p>Notre système de chronométrage permet un affichage instantané des résultats, classements et temps intermédiaires.</p>"
    },
    {
      "type": "features",
      "title": "Affichage et diffusion",
      "items": [
        {
          "icon": "tv",
          "title": "Écrans géants",
          "description": "Affichage dynamique sur site avec animations personnalisées"
        },
        {
          "icon": "globe",
          "title": "Site web live",
          "description": "Résultats accessibles en temps réel depuis n''importe où"
        },
        {
          "icon": "bell",
          "title": "Notifications",
          "description": "Alertes automatiques pour les proches des participants"
        },
        {
          "icon": "download",
          "title": "Export instantané",
          "description": "Téléchargement des résultats en PDF et CSV"
        }
      ]
    }
  ]'::jsonb
),
(
  'paiement',
  'Paiement sécurisé',
  'shield-check',
  'Transactions sécurisées avec les standards les plus élevés de protection des données.',
  'Paiements 100% sécurisés',
  'Conformité PCI-DSS et protection maximale pour vos transactions',
  true,
  4,
  '[
    {
      "type": "section",
      "title": "Sécurité maximale",
      "content": "<p>Nous utilisons les technologies de paiement les plus sécurisées du marché pour protéger les données de vos participants.</p>"
    },
    {
      "type": "features",
      "title": "Garanties de sécurité",
      "items": [
        {
          "icon": "lock",
          "title": "Cryptage SSL",
          "description": "Toutes les transactions sont cryptées en 256 bits"
        },
        {
          "icon": "shield",
          "title": "PCI-DSS",
          "description": "Conformité totale aux normes bancaires internationales"
        },
        {
          "icon": "check-circle",
          "title": "3D Secure",
          "description": "Validation renforcée pour plus de sécurité"
        },
        {
          "icon": "file-text",
          "title": "RGPD",
          "description": "Protection des données personnelles garantie"
        }
      ]
    }
  ]'::jsonb
),
(
  'gestion',
  'Gestion complète',
  'clipboard-list',
  'Outils complets pour les organisateurs : inscriptions, paiements, dossards, certificats.',
  'Backoffice organisateur tout-en-un',
  'Gérez votre événement de A à Z avec nos outils professionnels',
  true,
  5,
  '[
    {
      "type": "section",
      "title": "Pilotez votre événement",
      "content": "<p>Notre backoffice vous donne un contrôle total sur tous les aspects de votre événement sportif.</p>"
    },
    {
      "type": "features",
      "title": "Modules de gestion",
      "items": [
        {
          "icon": "users",
          "title": "Inscriptions",
          "description": "Gestion complète des participants et de leurs données"
        },
        {
          "icon": "hash",
          "title": "Dossards",
          "description": "Attribution automatique ou manuelle des numéros"
        },
        {
          "icon": "file-check",
          "title": "Documents",
          "description": "Collecte et validation des certificats médicaux"
        },
        {
          "icon": "bar-chart",
          "title": "Statistiques",
          "description": "Tableaux de bord et rapports détaillés"
        }
      ]
    }
  ]'::jsonb
),
(
  'statistiques',
  'Statistiques avancées',
  'bar-chart-2',
  'Analyses détaillées et tableaux de bord pour suivre vos événements et performances.',
  'Analytics et reporting avancés',
  'Des insights précieux pour optimiser vos événements',
  true,
  6,
  '[
    {
      "type": "section",
      "title": "Données en temps réel",
      "content": "<p>Accédez à des analyses détaillées de vos événements avec des tableaux de bord interactifs.</p>"
    },
    {
      "type": "features",
      "title": "Analyses disponibles",
      "items": [
        {
          "icon": "pie-chart",
          "title": "Inscriptions",
          "description": "Evolution des inscriptions jour par jour"
        },
        {
          "icon": "activity",
          "title": "Performance",
          "description": "Statistiques de temps et allures par catégorie"
        },
        {
          "icon": "users",
          "title": "Démographie",
          "description": "Répartition par âge, sexe, origine géographique"
        },
        {
          "icon": "trending-up",
          "title": "Évolution",
          "description": "Comparaison avec les éditions précédentes"
        }
      ]
    }
  ]'::jsonb
);
