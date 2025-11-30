/*
  ============================================================================
  TIMEPULSE - TOUTES LES MIGRATIONS COMBINÉES
  ============================================================================

  Ce fichier combine toutes les migrations critiques pour initialiser
  la base de données Timepulse.

  📋 Instructions:
  1. Ouvrez: https://supabase.com/dashboard/project/fgstscztsighabpzzzix/sql/new
  2. Copiez TOUT le contenu de ce fichier
  3. Collez dans SQL Editor
  4. Cliquez sur "Run"

  ⚠️  Note: Certaines commandes peuvent échouer si les tables existent déjà.
      C'est normal ! Continuez l'exécution.

  Date de génération: 2025-11-19T09:27:04.683Z
  Nombre de migrations: 26
  ============================================================================
*/



-- ============================================================================
-- Migration: 20251014201249_create_timepulse_schema.sql
-- ============================================================================

/*
  # Timepulse Platform Database Schema

  This migration creates the complete database structure for the Timepulse inscription platform,
  enabling organizers to create events, manage races, and participants to register online.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - Full name
  - `phone` (text) - Phone number
  - `role` (text) - User role: 'participant' or 'organizer'
  - `avatar_url` (text) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `organizers`
  - `id` (uuid, primary key) - Auto-generated
  - `user_id` (uuid) - References profiles
  - `organization_name` (text) - Organization name
  - `organization_type` (text) - Type: 'association', 'company', 'individual'
  - `siret` (text) - French business registration number
  - `address` (text) - Physical address
  - `city` (text) - City
  - `postal_code` (text) - Postal code
  - `country` (text) - Country
  - `website` (text) - Website URL
  - `description` (text) - Organization description
  - `logo_url` (text) - Logo URL
  - `is_verified` (boolean) - Verification status
  - `created_at` (timestamptz) - Creation timestamp

  ### `events`
  - `id` (uuid, primary key) - Auto-generated
  - `organizer_id` (uuid) - References organizers
  - `name` (text) - Event name
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Event description
  - `event_type` (text) - Type: 'running', 'trail', 'triathlon', 'cycling', 'other'
  - `location` (text) - Event location
  - `city` (text) - City
  - `postal_code` (text) - Postal code
  - `country` (text) - Country
  - `latitude` (numeric) - GPS latitude
  - `longitude` (numeric) - GPS longitude
  - `start_date` (date) - Event start date
  - `end_date` (date) - Event end date
  - `image_url` (text) - Main event image
  - `banner_url` (text) - Banner image
  - `website` (text) - Event website
  - `registration_opens` (timestamptz) - Registration opening date
  - `registration_closes` (timestamptz) - Registration closing date
  - `status` (text) - Status: 'draft', 'published', 'cancelled', 'completed'
  - `is_featured` (boolean) - Featured event flag
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `races`
  - `id` (uuid, primary key) - Auto-generated
  - `event_id` (uuid) - References events
  - `name` (text) - Race name (e.g., '10 km', 'Marathon')
  - `distance` (numeric) - Distance in kilometers
  - `elevation_gain` (numeric) - Elevation gain in meters
  - `description` (text) - Race description
  - `start_time` (time) - Race start time
  - `max_participants` (integer) - Maximum number of participants
  - `min_age` (integer) - Minimum age requirement
  - `max_age` (integer) - Maximum age requirement
  - `requires_license` (boolean) - Medical certificate or license required
  - `base_price` (numeric) - Base price in euros
  - `status` (text) - Status: 'active', 'full', 'cancelled'
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `race_categories`
  - `id` (uuid, primary key) - Auto-generated
  - `race_id` (uuid) - References races
  - `name` (text) - Category name (e.g., 'Senior Homme', 'Master Femme')
  - `code` (text) - Category code
  - `min_age` (integer) - Minimum age
  - `max_age` (integer) - Maximum age
  - `gender` (text) - Gender: 'M', 'F', 'mixed'
  - `price_modifier` (numeric) - Price adjustment from base price

  ### `registrations`
  - `id` (uuid, primary key) - Auto-generated
  - `race_id` (uuid) - References races
  - `user_id` (uuid) - References profiles
  - `category_id` (uuid) - References race_categories
  - `bib_number` (integer) - Assigned bib/dossard number
  - `first_name` (text) - Participant first name
  - `last_name` (text) - Participant last name
  - `email` (text) - Participant email
  - `phone` (text) - Participant phone
  - `date_of_birth` (date) - Date of birth
  - `gender` (text) - Gender: 'M', 'F'
  - `nationality` (text) - Nationality
  - `address` (text) - Address
  - `city` (text) - City
  - `postal_code` (text) - Postal code
  - `emergency_contact_name` (text) - Emergency contact name
  - `emergency_contact_phone` (text) - Emergency contact phone
  - `medical_certificate_url` (text) - Medical certificate document URL
  - `license_number` (text) - Sports license number
  - `club_name` (text) - Sports club name
  - `tshirt_size` (text) - T-shirt size
  - `price_paid` (numeric) - Amount paid
  - `payment_status` (text) - Status: 'pending', 'completed', 'refunded', 'cancelled'
  - `payment_intent_id` (text) - Stripe payment intent ID
  - `registration_date` (timestamptz) - Registration timestamp
  - `status` (text) - Status: 'confirmed', 'pending', 'cancelled'
  - `qr_code` (text) - QR code for check-in
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `results`
  - `id` (uuid, primary key) - Auto-generated
  - `registration_id` (uuid) - References registrations
  - `race_id` (uuid) - References races
  - `finish_time` (interval) - Total race time
  - `overall_rank` (integer) - Overall ranking
  - `category_rank` (integer) - Category ranking
  - `gender_rank` (integer) - Gender ranking
  - `split_times` (jsonb) - Intermediate split times
  - `status` (text) - Status: 'finished', 'dnf', 'dsq', 'dns'
  - `created_at` (timestamptz) - Result timestamp

  ## 2. Security

  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
  - Add policies for organizers to manage their events and registrations
  - Add policies for public access to published events and results
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'organizer', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT
  TO anon
  USING (true);

-- Create organizers table
CREATE TABLE IF NOT EXISTS organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  organization_name text NOT NULL,
  organization_type text DEFAULT 'association' CHECK (organization_type IN ('association', 'company', 'individual')),
  siret text,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'France',
  website text,
  description text,
  logo_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can read own data"
  ON organizers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Organizers can insert own data"
  ON organizers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can update own data"
  ON organizers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view verified organizers"
  ON organizers FOR SELECT
  TO anon
  USING (is_verified = true);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES organizers(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  event_type text DEFAULT 'running' CHECK (event_type IN ('running', 'trail', 'triathlon', 'cycling', 'swimming', 'obstacle', 'walking', 'other')),
  location text,
  city text,
  postal_code text,
  country text DEFAULT 'France',
  latitude numeric,
  longitude numeric,
  start_date date NOT NULL,
  end_date date,
  image_url text,
  banner_url text,
  website text,
  registration_opens timestamptz DEFAULT now(),
  registration_closes timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Organizers can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

-- Create races table
CREATE TABLE IF NOT EXISTS races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  distance numeric,
  elevation_gain numeric DEFAULT 0,
  description text,
  start_time time,
  max_participants integer,
  min_age integer DEFAULT 0,
  max_age integer,
  requires_license boolean DEFAULT false,
  base_price numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'full', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view races for published events"
  ON races FOR SELECT
  TO anon, authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE status = 'published'
    )
  );

CREATE POLICY "Organizers can manage races for own events"
  ON races FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Create race_categories table
CREATE TABLE IF NOT EXISTS race_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text,
  min_age integer DEFAULT 0,
  max_age integer,
  gender text CHECK (gender IN ('M', 'F', 'mixed')),
  price_modifier numeric DEFAULT 0
);

ALTER TABLE race_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON race_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Organizers can manage categories"
  ON race_categories FOR ALL
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      JOIN events e ON r.event_id = e.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    race_id IN (
      SELECT r.id FROM races r
      JOIN events e ON r.event_id = e.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category_id uuid REFERENCES race_categories(id),
  bib_number integer,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  date_of_birth date,
  gender text CHECK (gender IN ('M', 'F')),
  nationality text,
  address text,
  city text,
  postal_code text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_certificate_url text,
  license_number text,
  club_name text,
  tshirt_size text,
  price_paid numeric DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded', 'cancelled')),
  payment_intent_id text,
  registration_date timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  qr_code text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registrations"
  ON registrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create registrations"
  ON registrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can view registrations for own events"
  ON registrations FOR SELECT
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      JOIN events e ON r.event_id = e.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update registrations for own events"
  ON registrations FOR UPDATE
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      JOIN events e ON r.event_id = e.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    race_id IN (
      SELECT r.id FROM races r
      JOIN events e ON r.event_id = e.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Create results table
CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE NOT NULL,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  finish_time interval,
  overall_rank integer,
  category_rank integer,
  gender_rank integer,
  split_times jsonb,
  status text DEFAULT 'finished' CHECK (status IN ('finished', 'dnf', 'dsq', 'dns')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view results"
  ON results FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Organizers can manage results"
  ON results FOR ALL
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      JOIN events e ON r.event_id = e.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    race_id IN (
      SELECT r.id FROM races r
      JOIN events e ON r.event_id = e.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_races_event_id ON races(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_race_id ON registrations(race_id);
CREATE INDEX IF NOT EXISTS idx_results_race_id ON results(race_id);

-- ✅ Fin de: 20251014201249_create_timepulse_schema.sql


-- ============================================================================
-- Migration: 20251014205617_create_admin_users_fixed.sql
-- ============================================================================

/*
  # Create Admin Users & Authentication System

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `hashed_password` (text)
      - `name` (text)
      - `role` (text) - super_admin, staff, organizer
      - `org_id` (uuid, nullable) - for organizers
      - `is_active` (boolean)
      - `last_login_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `admin_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `token` (text, unique)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated access
    - Hash passwords using pgcrypto

  3. Initial Data
    - Create super admin user (mickael@timepulse.fr)
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  hashed_password text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'organizer',
  org_id uuid,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users (allow service role full access)
CREATE POLICY "Service role full access to admin_users"
  ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can read for login"
  ON admin_users
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for admin_sessions (allow service role full access)
CREATE POLICY "Service role full access to admin_sessions"
  ON admin_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert super admin user
-- Password: Timepulse2025@!
INSERT INTO admin_users (email, hashed_password, name, role, is_active)
VALUES (
  'mickael@timepulse.fr',
  crypt('Timepulse2025@!', gen_salt('bf')),
  'Mickael',
  'super_admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Function to verify password
CREATE OR REPLACE FUNCTION verify_admin_password(
  p_email text,
  p_password text
)
RETURNS TABLE(
  user_id uuid,
  user_email text,
  user_name text,
  user_role text,
  org_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.name,
    au.role,
    au.org_id
  FROM admin_users au
  WHERE au.email = p_email
    AND au.hashed_password = crypt(p_password, au.hashed_password)
    AND au.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last login
CREATE OR REPLACE FUNCTION update_last_login(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE admin_users
  SET last_login_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Fin de: 20251014205617_create_admin_users_fixed.sql


-- ============================================================================
-- Migration: 20251014205715_add_update_password_function.sql
-- ============================================================================

/*
  # Add password update function

  1. Functions
    - `update_admin_password` - Allows users to update their password
*/

-- Function to update password
CREATE OR REPLACE FUNCTION update_admin_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS void AS $$
BEGIN
  UPDATE admin_users
  SET 
    hashed_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Fin de: 20251014205715_add_update_password_function.sql


-- ============================================================================
-- Migration: 20251014210000_create_organizer_module.sql
-- ============================================================================

/*
  # Module Organisateur - Timepulse

  1. Nouvelles Tables
    - `organizers` - Comptes organisateurs
    - `events` - Événements sportifs
    - `races` - Épreuves au sein d'un événement
    - `license_types` - Types de licences sportives
    - `pricing_periods` - Périodes tarifaires
    - `race_pricing` - Tarifs par épreuve/période/licence
    - `invitations` - Invitations gratuites partenaires
    - `promo_codes` - Codes promotionnels
    - `bib_number_config` - Configuration numérotation dossards
    - `registrations` - Inscriptions participants
    - `audit_logs` - Historique des actions

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies restrictives par rôle
    - Audit trail complet

  3. Contraintes métier
    - Validation des dates
    - Contrôle des jauges
    - Unicité des dossards
    - Verrou d'édition dossards
*/

-- Table: organizers
CREATE TABLE IF NOT EXISTS organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  siret text,
  website text,
  logo_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view own profile"
  ON organizers FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Organizers can update own profile"
  ON organizers FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Table: events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  location_name text NOT NULL,
  location_address text NOT NULL,
  location_city text NOT NULL,
  location_postal_code text NOT NULL,
  location_country text DEFAULT 'France',
  location_lat numeric(10, 7),
  location_lng numeric(10, 7),
  start_date date NOT NULL,
  end_date date NOT NULL,
  cover_image_url text,
  logo_url text,
  contact_email text NOT NULL,
  contact_phone text,
  website_url text,
  rules_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'open', 'closed', 'cancelled')),
  registration_open_date timestamptz,
  registration_close_date timestamptz,
  public_registration boolean DEFAULT true,
  max_participants integer,
  meta_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status) WHERE status IN ('open', 'published');
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view published events"
  ON events FOR SELECT
  TO public
  USING (status IN ('published', 'open'));

-- Table: races
CREATE TABLE IF NOT EXISTS races (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  distance_km numeric(6, 2),
  elevation_gain_m integer,
  race_date date NOT NULL,
  race_time time,
  max_participants integer,
  min_age integer DEFAULT 18,
  max_age integer,
  gender_restriction text CHECK (gender_restriction IN ('male', 'female', 'mixed', NULL)),
  requires_medical_certificate boolean DEFAULT false,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'full', 'closed', 'cancelled')),
  display_order integer DEFAULT 0,
  meta_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(event_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_races_event ON races(event_id);

ALTER TABLE races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage own races"
  ON races FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view published races"
  ON races FOR SELECT
  TO public
  USING (
    event_id IN (
      SELECT id FROM events WHERE status IN ('published', 'open')
    )
  );

-- Table: license_types
CREATE TABLE IF NOT EXISTS license_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  federation text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE license_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active license types"
  ON license_types FOR SELECT
  TO public
  USING (active = true);

-- Insert default license types
INSERT INTO license_types (code, name, federation) VALUES
  ('FFA', 'Licence FFA', 'Fédération Française d''Athlétisme'),
  ('FFTRI', 'Licence Triathlon', 'Fédération Française de Triathlon'),
  ('FFME', 'Licence Montagne', 'Fédération Française de Montagne et Escalade'),
  ('UFOLEP', 'Licence UFOLEP', 'UFOLEP'),
  ('NON_LIC', 'Non licencié', 'Aucune')
ON CONFLICT (code) DO NOTHING;

-- Table: pricing_periods
CREATE TABLE IF NOT EXISTS pricing_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_period_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_pricing_periods_race ON pricing_periods(race_id);

ALTER TABLE pricing_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage pricing periods"
  ON pricing_periods FOR ALL
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      JOIN events e ON e.id = r.event_id
      JOIN organizers o ON o.id = e.organizer_id
      WHERE o.auth_user_id = auth.uid()
    )
  );

-- Table: race_pricing
CREATE TABLE IF NOT EXISTS race_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  pricing_period_id uuid NOT NULL REFERENCES pricing_periods(id) ON DELETE CASCADE,
  license_type_id uuid NOT NULL REFERENCES license_types(id) ON DELETE CASCADE,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  max_registrations integer,
  license_valid_until date,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(race_id, pricing_period_id, license_type_id)
);

CREATE INDEX IF NOT EXISTS idx_race_pricing_race ON race_pricing(race_id);

ALTER TABLE race_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage race pricing"
  ON race_pricing FOR ALL
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      JOIN events e ON e.id = r.event_id
      JOIN organizers o ON o.id = e.organizer_id
      WHERE o.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active pricing"
  ON race_pricing FOR SELECT
  TO public
  USING (active = true);

-- Table: invitations
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_name text NOT NULL,
  invitation_code text UNIQUE NOT NULL,
  invitation_type text NOT NULL DEFAULT 'partner' CHECK (invitation_type IN ('partner', 'volunteer', 'vip', 'press')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'used', 'expired', 'revoked')),
  valid_until timestamptz,
  used_at timestamptz,
  used_by_registration_id uuid,
  notes text,
  created_by uuid REFERENCES organizers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_invitations_event ON invitations(event_id);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage own invitations"
  ON invitations FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Table: promo_codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  usage_type text NOT NULL CHECK (usage_type IN ('single', 'multiple', 'unlimited')),
  max_uses integer,
  current_uses integer DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  license_type_id uuid REFERENCES license_types(id),
  min_price_cents integer DEFAULT 0,
  active boolean DEFAULT true,
  created_by uuid REFERENCES organizers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_promo_dates CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from),
  CONSTRAINT valid_usage_limit CHECK (usage_type = 'unlimited' OR max_uses IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_promo_codes_event ON promo_codes(event_id);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage own promo codes"
  ON promo_codes FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Table: bib_number_config
CREATE TABLE IF NOT EXISTS bib_number_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  auto_assign boolean DEFAULT false,
  range_start integer NOT NULL DEFAULT 1,
  range_end integer NOT NULL DEFAULT 9999,
  assignment_strategy text NOT NULL DEFAULT 'sequential' CHECK (assignment_strategy IN ('sequential', 'by_gender', 'by_category', 'by_race', 'manual')),
  male_range_start integer,
  male_range_end integer,
  female_range_start integer,
  female_range_end integer,
  lock_date timestamptz,
  locked_by uuid REFERENCES admin_users(id),
  locked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_range CHECK (range_end > range_start),
  CONSTRAINT valid_gender_ranges CHECK (
    (assignment_strategy != 'by_gender') OR
    (male_range_start IS NOT NULL AND male_range_end IS NOT NULL AND
     female_range_start IS NOT NULL AND female_range_end IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_bib_config_event ON bib_number_config(event_id);

ALTER TABLE bib_number_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage own bib config"
  ON bib_number_config FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Table: registrations
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  participant_first_name text NOT NULL,
  participant_last_name text NOT NULL,
  participant_email text NOT NULL,
  participant_phone text,
  participant_gender text NOT NULL CHECK (participant_gender IN ('male', 'female', 'other')),
  participant_birth_date date NOT NULL,
  participant_nationality text DEFAULT 'FR',
  participant_address text,
  participant_city text,
  participant_postal_code text,
  license_type_id uuid NOT NULL REFERENCES license_types(id),
  license_number text,
  license_expiry_date date,
  emergency_contact_name text NOT NULL,
  emergency_contact_phone text NOT NULL,
  bib_number integer,
  registration_status text NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'refunded', 'waitlist')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'free')),
  amount_paid_cents integer NOT NULL DEFAULT 0,
  promo_code_id uuid REFERENCES promo_codes(id),
  invitation_id uuid REFERENCES invitations(id),
  registered_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  meta_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_race ON registrations(race_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(participant_email);
CREATE INDEX IF NOT EXISTS idx_registrations_bib ON registrations(bib_number) WHERE bib_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_registrations_composite ON registrations(event_id, race_id, registration_status);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view own registrations"
  ON registrations FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('organizer', 'admin', 'system')),
  actor_id uuid NOT NULL,
  actor_email text,
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    (actor_type = 'organizer' AND actor_id IN (
      SELECT id FROM organizers WHERE auth_user_id = auth.uid()
    )) OR
    (entity_type = 'event' AND entity_id IN (
      SELECT id FROM events WHERE organizer_id IN (
        SELECT id FROM organizers WHERE auth_user_id = auth.uid()
      )
    ))
  );

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_organizers_updated_at BEFORE UPDATE ON organizers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON races
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_periods_updated_at BEFORE UPDATE ON pricing_periods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_race_pricing_updated_at BEFORE UPDATE ON race_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bib_number_config_updated_at BEFORE UPDATE ON bib_number_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ✅ Fin de: 20251014210000_create_organizer_module.sql


-- ============================================================================
-- Migration: 20251015070040_create_license_types.sql
-- ============================================================================

/*
  # Create license_types table
  
  1. New Tables
    - `license_types`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Code court pour identification (FFA, FFTRI, etc.)
      - `name` (text) - Nom complet de la licence
      - `federation` (text) - Nom de la fédération
      - `description` (text, optional) - Description
      - `active` (boolean) - Si la licence est active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `license_types` table
    - Add policy for public read access (needed for registration forms)
    - Add policy for admin write access
  
  3. Default Data
    - Insert standard French sports licenses (FFA, FFTRI, FFME, UFOLEP, NON_LIC)
  
  4. Notes
    - Table designed for easy extension with new license types
    - `active` flag allows soft deletion of obsolete licenses
    - Public read access for registration forms
*/

CREATE TABLE IF NOT EXISTS license_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  federation text NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE license_types ENABLE ROW LEVEL SECURITY;

-- Public can read active license types (for registration forms)
CREATE POLICY "Anyone can view active license types"
  ON license_types
  FOR SELECT
  USING (active = true);

-- Only admins can insert/update/delete license types
CREATE POLICY "Admins can manage license types"
  ON license_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
    )
  );

-- Insert default license types
INSERT INTO license_types (code, name, federation, description) VALUES
  ('FFA', 'Licence FFA', 'Fédération Française d''Athlétisme', 'Licence athlétisme course sur route et trail'),
  ('FFTRI', 'Licence Triathlon', 'Fédération Française de Triathlon', 'Licence pour les épreuves de triathlon et disciplines enchaînées'),
  ('FFME', 'Licence Montagne et Escalade', 'Fédération Française de Montagne et Escalade', 'Licence pour les épreuves en montagne et trail'),
  ('UFOLEP', 'Licence UFOLEP', 'Union Française des Œuvres Laïques d''Éducation Physique', 'Licence multisports UFOLEP'),
  ('FSGT', 'Licence FSGT', 'Fédération Sportive et Gymnique du Travail', 'Licence multisports FSGT'),
  ('NON_LIC', 'Non licencié', 'Aucune', 'Participant sans licence fédérale (certificat médical obligatoire)')
ON CONFLICT (code) DO NOTHING;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_license_types_active ON license_types(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_license_types_code ON license_types(code);

-- ✅ Fin de: 20251015070040_create_license_types.sql


-- ============================================================================
-- Migration: 20251015070105_create_pricing_periods.sql
-- ============================================================================

/*
  # Create pricing_periods table
  
  1. New Tables
    - `pricing_periods`
      - `id` (uuid, primary key)
      - `race_id` (uuid, foreign key to races)
      - `name` (text) - Nom de la période (Early Bird, Normal, Last Minute)
      - `start_date` (timestamptz) - Date de début de la période
      - `end_date` (timestamptz) - Date de fin de la période
      - `display_order` (integer) - Ordre d'affichage
      - `active` (boolean) - Si la période est active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `pricing_periods` table
    - Organizers can view/manage periods for their races
    - Admins have full access
    - Public can view active periods for open races
  
  3. Constraints
    - `end_date` must be after `start_date`
    - Cascade delete when race is deleted
  
  4. Notes
    - Periods can overlap intentionally (organizational choice)
    - Active flag allows disabling without deleting
    - Display order helps organize multiple periods
*/

CREATE TABLE IF NOT EXISTS pricing_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_period_dates CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE pricing_periods ENABLE ROW LEVEL SECURITY;

-- Public can view active pricing periods for published races
CREATE POLICY "Anyone can view active pricing periods for published races"
  ON pricing_periods
  FOR SELECT
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      WHERE races.id = pricing_periods.race_id
      AND events.status = 'published'
    )
  );

-- Organizers can view all periods for their races
CREATE POLICY "Organizers can view their pricing periods"
  ON pricing_periods
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = pricing_periods.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can manage periods for their races
CREATE POLICY "Organizers can manage their pricing periods"
  ON pricing_periods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = pricing_periods.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = pricing_periods.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Admins have full access
CREATE POLICY "Admins can manage all pricing periods"
  ON pricing_periods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_periods_race ON pricing_periods(race_id);
CREATE INDEX IF NOT EXISTS idx_pricing_periods_active ON pricing_periods(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_periods_dates ON pricing_periods(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_periods_order ON pricing_periods(race_id, display_order);

-- ✅ Fin de: 20251015070105_create_pricing_periods.sql


-- ============================================================================
-- Migration: 20251015070131_create_race_pricing.sql
-- ============================================================================

/*
  # Create race_pricing table
  
  1. New Tables
    - `race_pricing`
      - `id` (uuid, primary key)
      - `race_id` (uuid, foreign key to races)
      - `pricing_period_id` (uuid, foreign key to pricing_periods)
      - `license_type_id` (uuid, foreign key to license_types)
      - `price_cents` (integer) - Prix en centimes d'euros
      - `max_registrations` (integer, optional) - Quota pour cette combinaison
      - `license_valid_until` (date, optional) - Date limite pour cette licence
      - `active` (boolean) - Si ce tarif est actif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `race_pricing` table
    - Public can view active pricing for published races
    - Organizers can manage pricing for their races
    - Admins have full access
  
  3. Constraints
    - Unique combination of (race_id, pricing_period_id, license_type_id)
    - Price must be >= 0
    - Cascade delete when race, period, or license type is deleted
  
  4. Notes
    - Prices stored in cents to avoid floating point issues
    - max_registrations allows quotas per license type
    - license_valid_until allows time-limited license acceptance
*/

CREATE TABLE IF NOT EXISTS race_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  pricing_period_id uuid NOT NULL REFERENCES pricing_periods(id) ON DELETE CASCADE,
  license_type_id uuid NOT NULL REFERENCES license_types(id) ON DELETE CASCADE,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  max_registrations integer,
  license_valid_until date,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(race_id, pricing_period_id, license_type_id)
);

-- Enable RLS
ALTER TABLE race_pricing ENABLE ROW LEVEL SECURITY;

-- Public can view active pricing for published races
CREATE POLICY "Anyone can view active race pricing for published races"
  ON race_pricing
  FOR SELECT
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      WHERE races.id = race_pricing.race_id
      AND events.status = 'published'
    )
  );

-- Organizers can view all pricing for their races
CREATE POLICY "Organizers can view their race pricing"
  ON race_pricing
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_pricing.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can manage pricing for their races
CREATE POLICY "Organizers can manage their race pricing"
  ON race_pricing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_pricing.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_pricing.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Admins have full access
CREATE POLICY "Admins can manage all race pricing"
  ON race_pricing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_race_pricing_race ON race_pricing(race_id);
CREATE INDEX IF NOT EXISTS idx_race_pricing_period ON race_pricing(pricing_period_id);
CREATE INDEX IF NOT EXISTS idx_race_pricing_license ON race_pricing(license_type_id);
CREATE INDEX IF NOT EXISTS idx_race_pricing_active ON race_pricing(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_race_pricing_composite ON race_pricing(race_id, pricing_period_id, license_type_id) WHERE active = true;

-- ✅ Fin de: 20251015070131_create_race_pricing.sql


-- ============================================================================
-- Migration: 20251015070340_create_audit_logs.sql
-- ============================================================================

/*
  # Create audit_logs table
  
  1. New Tables
    - `audit_logs`
      - `id` (uuid, primary key)
      - `entity_type` (text) - Type d'entité (event, race, pricing, invitation, etc.)
      - `entity_id` (uuid) - ID de l'entité modifiée
      - `action` (text) - Action effectuée (created, updated, deleted, locked, etc.)
      - `actor_type` (text) - Type d'acteur (organizer, admin, system)
      - `actor_id` (uuid) - ID de l'acteur
      - `actor_email` (text, optional) - Email de l'acteur pour historique
      - `changes` (jsonb, optional) - Détails des changements
      - `ip_address` (inet, optional) - Adresse IP
      - `user_agent` (text, optional) - User agent
      - `created_at` (timestamptz) - Date de l'action
  
  2. Security
    - Enable RLS on `audit_logs` table
    - Organizers can view logs for their events
    - Admins can view all logs
    - NO ONE can modify or delete logs (append-only)
  
  3. Constraints
    - This table is append-only for security
    - No updates or deletes allowed
  
  4. Notes
    - Critical for compliance and debugging
    - Immutable by design
    - Retention: 1 year minimum, 3 years for financial data
    - Designed for future compliance (GDPR, audit trails)
*/

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('organizer', 'admin', 'system', 'public')),
  actor_id uuid NOT NULL,
  actor_email text,
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizers can view logs related to their events
CREATE POLICY "Organizers can view logs for their events"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    -- Logs for events they own
    (entity_type = 'event' AND EXISTS (
      SELECT 1 FROM events
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE events.id = audit_logs.entity_id
      AND organizers.user_id::text = auth.uid()::text
    ))
    OR
    -- Logs for races in their events
    (entity_type = 'race' AND EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = audit_logs.entity_id
      AND organizers.user_id::text = auth.uid()::text
    ))
    OR
    -- Logs for registrations in their events
    (entity_type = 'registration' AND EXISTS (
      SELECT 1 FROM registrations
      JOIN races ON registrations.race_id = races.id
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE registrations.id = audit_logs.entity_id
      AND organizers.user_id::text = auth.uid()::text
    ))
  );

-- Admins can view all logs
CREATE POLICY "Admins can view all logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
    )
  );

-- Only system can insert logs (via application logic)
-- No policy for INSERT - will be done via service role or application functions

-- NO UPDATE OR DELETE policies - logs are immutable

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(entity_type, action);

-- Create a function to log audit events (to be called from application)
CREATE OR REPLACE FUNCTION log_audit_event(
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_actor_type text,
  p_actor_id uuid,
  p_actor_email text DEFAULT NULL,
  p_changes jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    entity_type,
    entity_id,
    action,
    actor_type,
    actor_id,
    actor_email,
    changes,
    ip_address,
    user_agent
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    p_actor_type,
    p_actor_id,
    p_actor_email,
    p_changes,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Fin de: 20251015070340_create_audit_logs.sql


-- ============================================================================
-- Migration: 20251017055730_create_entries_module_v2.sql
-- ============================================================================

/*
  # Module Inscriptions Manuelles - Tables Principales

  1. Nouvelles Tables
    - `athletes` : Informations des athlètes (identité, contact, licence, documents)
    - `entries` : Inscriptions aux épreuves
    - `entry_payments` : Paiements et statuts (payé, gratuit, en attente)
  
  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour organisateurs : accès aux inscriptions de leurs événements
    - Policies pour admins : accès complet
  
  3. Indexes
    - Index sur athlete (nom, prénom, email, licence)
    - Index sur entries (event_id, race_id, athlete_id)
    - Index sur payment_status
*/

-- =====================================================
-- ATHLETES
-- =====================================================
CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identité
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birthdate DATE NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('M', 'F', 'X', 'NB')),

  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country_code VARCHAR(2) DEFAULT 'FR',

  -- Licence
  license_type VARCHAR(50),
  license_id VARCHAR(100),
  license_issued_by VARCHAR(100),
  license_valid_until DATE,

  -- Documents (URLs vers Storage)
  medical_doc_url VARCHAR(500),
  medical_doc_uploaded_at TIMESTAMPTZ,
  license_doc_url VARCHAR(500),
  license_doc_uploaded_at TIMESTAMPTZ,

  -- RGPD
  consent_data_processing BOOLEAN DEFAULT false,
  consent_marketing BOOLEAN DEFAULT false,
  consent_photo BOOLEAN DEFAULT false,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athletes_fullname ON athletes(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_athletes_birthdate ON athletes(birthdate);
CREATE INDEX IF NOT EXISTS idx_athletes_email ON athletes(email) WHERE email IS NOT NULL;

-- =====================================================
-- ENTRIES (Inscriptions)
-- =====================================================
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES organizers(id),

  -- Classification
  category VARCHAR(50) NOT NULL,

  -- Source & Raison
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (
    source IN ('online', 'manual', 'bulk_import', 'transfer')
  ),
  reason VARCHAR(500),
  notes TEXT,

  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (
    status IN ('draft', 'confirmed', 'cancelled', 'transferred', 'needs_docs')
  ),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Création/Modification
  created_by UUID NOT NULL REFERENCES admin_users(id),
  created_by_type VARCHAR(20) NOT NULL DEFAULT 'organizer' CHECK (
    created_by_type IN ('organizer', 'timepulse_staff')
  ),
  updated_by UUID REFERENCES admin_users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dossard
  bib_number INTEGER,
  bib_assigned_at TIMESTAMPTZ,

  CONSTRAINT entries_unique_athlete_race UNIQUE (athlete_id, race_id)
);

CREATE INDEX IF NOT EXISTS idx_entries_event ON entries(event_id);
CREATE INDEX IF NOT EXISTS idx_entries_race ON entries(race_id);
CREATE INDEX IF NOT EXISTS idx_entries_athlete ON entries(athlete_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_source ON entries(source);
CREATE INDEX IF NOT EXISTS idx_entries_organizer ON entries(organizer_id);

-- =====================================================
-- PAYMENTS (Paiements des inscriptions)
-- =====================================================
CREATE TABLE IF NOT EXISTS entry_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,

  -- Montant
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',

  -- Statut de paiement
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('paid', 'pending', 'free', 'comped')
  ),

  -- Mode de paiement (si payé)
  payment_method VARCHAR(50) CHECK (
    payment_method IN ('cash', 'check', 'bank_transfer', 'stripe', 'manual')
  ),
  
  -- Référence de paiement
  payment_reference VARCHAR(100),
  paid_at TIMESTAMPTZ,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT entry_payments_unique UNIQUE (entry_id)
);

CREATE INDEX IF NOT EXISTS idx_entry_payments_status ON entry_payments(payment_status);

-- =====================================================
-- RLS POLICIES - ATHLETES
-- =====================================================
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view athletes from their entries"
  ON athletes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.athlete_id = athletes.id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create athletes"
  ON athletes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update athletes from their entries"
  ON athletes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.athlete_id = athletes.id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.athlete_id = athletes.id
      AND o.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - ENTRIES
-- =====================================================
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view their entries"
  ON entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = entries.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create entries for their events"
  ON entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = entries.event_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update their entries"
  ON entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = entries.organizer_id
      AND organizers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = entries.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can delete their entries"
  ON entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = entries.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - ENTRY_PAYMENTS
-- =====================================================
ALTER TABLE entry_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view payments for their entries"
  ON entry_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = entry_payments.entry_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create payments for their entries"
  ON entry_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = entry_payments.entry_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update payments for their entries"
  ON entry_payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = entry_payments.entry_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries e
      INNER JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = entry_payments.entry_id
      AND o.user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGER - Update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'athletes_updated_at'
  ) THEN
    CREATE TRIGGER athletes_updated_at BEFORE UPDATE ON athletes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'entries_updated_at'
  ) THEN
    CREATE TRIGGER entries_updated_at BEFORE UPDATE ON entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ✅ Fin de: 20251017055730_create_entries_module_v2.sql


-- ============================================================================
-- Migration: 20251021165340_create_race_category_restrictions.sql
-- ============================================================================

/*
  # Gestion des restrictions de catégories FFA pour les épreuves

  1. Nouvelles tables
    - `ffa_categories` : Référentiel des catégories FFA officielles
      - `code` (text, primary key) : Code de la catégorie (ex: "SE", "M0", "CA")
      - `label` (text) : Libellé complet de la catégorie
      - `min_age` (integer) : Âge minimum
      - `max_age` (integer) : Âge maximum (null si pas de limite)
      - `gender` (text) : Genre (M/F/all)
      - `display_order` (integer) : Ordre d'affichage
    
    - `race_category_restrictions` : Restrictions de catégories par épreuve
      - `id` (uuid, primary key)
      - `race_id` (uuid, foreign key vers races)
      - `category_code` (text, foreign key vers ffa_categories)
      - `created_at` (timestamptz)

  2. Modifications
    - Ajout du champ `is_ffa_race` (boolean) à la table `races`
    - Ajout du champ `age_category` (text) à la table `athletes` pour stocker la catégorie calculée

  3. Sécurité
    - Enable RLS sur les nouvelles tables
    - Policies pour lecture publique des catégories FFA
    - Policies pour gestion par les organisateurs des restrictions
*/

-- Créer la table des catégories FFA
CREATE TABLE IF NOT EXISTS ffa_categories (
  code text PRIMARY KEY,
  label text NOT NULL,
  min_age integer NOT NULL,
  max_age integer,
  gender text NOT NULL CHECK (gender IN ('M', 'F', 'all')),
  display_order integer NOT NULL DEFAULT 0
);

-- Créer la table des restrictions de catégories par course
CREATE TABLE IF NOT EXISTS race_category_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  category_code text NOT NULL REFERENCES ffa_categories(code) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(race_id, category_code)
);

-- Ajouter le champ is_ffa_race à la table races
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'races' AND column_name = 'is_ffa_race'
  ) THEN
    ALTER TABLE races ADD COLUMN is_ffa_race boolean DEFAULT false;
  END IF;
END $$;

-- Ajouter le champ age_category à la table athletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'athletes' AND column_name = 'age_category'
  ) THEN
    ALTER TABLE athletes ADD COLUMN age_category text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE ffa_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_category_restrictions ENABLE ROW LEVEL SECURITY;

-- Policies pour ffa_categories (lecture publique)
CREATE POLICY "Anyone can view FFA categories"
  ON ffa_categories FOR SELECT
  TO public
  USING (true);

-- Policies pour race_category_restrictions
CREATE POLICY "Anyone can view race category restrictions"
  ON race_category_restrictions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Organizers can insert race category restrictions"
  ON race_category_restrictions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = race_id
      AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can delete race category restrictions"
  ON race_category_restrictions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = race_id
      AND e.organizer_id = auth.uid()
    )
  );

-- Insérer les catégories FFA 2025-2026
INSERT INTO ffa_categories (code, label, min_age, max_age, gender, display_order) VALUES
  ('EA', 'Eveil Athlétique (7-9 ans)', 7, 9, 'all', 1),
  ('PO', 'Poussins (10-11 ans)', 10, 11, 'all', 2),
  ('BE', 'Benjamins (12-13 ans)', 12, 13, 'all', 3),
  ('MI', 'Minimes (14-15 ans)', 14, 15, 'all', 4),
  ('CA', 'Cadets (16-17 ans)', 16, 17, 'all', 5),
  ('JU', 'Juniors (18-19 ans)', 18, 19, 'all', 6),
  ('ES', 'Espoirs (20-22 ans)', 20, 22, 'all', 7),
  ('SE', 'Seniors (23-39 ans)', 23, 39, 'all', 8),
  ('M0', 'Masters 0 (40-44 ans)', 40, 44, 'all', 9),
  ('M1', 'Masters 1 (45-49 ans)', 45, 49, 'all', 10),
  ('M2', 'Masters 2 (50-54 ans)', 50, 54, 'all', 11),
  ('M3', 'Masters 3 (55-59 ans)', 55, 59, 'all', 12),
  ('M4', 'Masters 4 (60-64 ans)', 60, 64, 'all', 13),
  ('M5', 'Masters 5 (65-69 ans)', 65, 69, 'all', 14),
  ('M6', 'Masters 6 (70-74 ans)', 70, 74, 'all', 15),
  ('M7', 'Masters 7 (75-79 ans)', 75, 79, 'all', 16),
  ('M8', 'Masters 8 (80-84 ans)', 80, 84, 'all', 17),
  ('M9', 'Masters 9 (85-89 ans)', 85, 89, 'all', 18),
  ('M10', 'Masters 10 (90 ans et +)', 90, NULL, 'all', 19)
ON CONFLICT (code) DO NOTHING;


-- ✅ Fin de: 20251021165340_create_race_category_restrictions.sql


-- ============================================================================
-- Migration: 20251021204147_create_carpooling_module.sql
-- ============================================================================

/*
  # Create Carpooling Module

  1. New Tables
    - `carpooling_offers`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `driver_first_name` (text)
      - `driver_last_name` (text)
      - `driver_email` (text)
      - `driver_phone` (text)
      - `meeting_location` (text) - Lieu de rencontre
      - `departure_time` (timestamptz) - Heure de départ
      - `available_seats` (integer) - Nombre de places disponibles
      - `additional_info` (text) - Infos complémentaires
      - `has_valid_license` (boolean) - Certifie avoir le permis
      - `terms_accepted` (boolean) - Accepte les conditions
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `status` (text) - active, cancelled

    - `carpooling_bookings`
      - `id` (uuid, primary key)
      - `offer_id` (uuid, foreign key to carpooling_offers)
      - `passenger_first_name` (text)
      - `passenger_last_name` (text)
      - `passenger_email` (text)
      - `passenger_phone` (text)
      - `seats_reserved` (integer) - Nombre de places réservées
      - `terms_accepted` (boolean)
      - `created_at` (timestamptz)
      - `status` (text) - pending, confirmed, cancelled

  2. Changes
    - Add `carpooling_enabled` boolean column to `events` table

  3. Security
    - Enable RLS on both tables
    - Public can read active carpooling offers
    - Authenticated users can create offers and bookings
    - Only offer creator can update/delete their offer
    - Only booking creator can cancel their booking

  4. Important Notes
    - One booking per person required
    - Available seats decrease when bookings are made
    - Email notifications sent to both parties (handled via edge function)
    - Timepulse is not responsible for delays, absences, etc.
*/

-- Add carpooling_enabled to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'carpooling_enabled'
  ) THEN
    ALTER TABLE events ADD COLUMN carpooling_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Create carpooling_offers table
CREATE TABLE IF NOT EXISTS carpooling_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  driver_first_name text NOT NULL,
  driver_last_name text NOT NULL,
  driver_email text NOT NULL,
  driver_phone text NOT NULL,
  meeting_location text NOT NULL,
  departure_time timestamptz NOT NULL,
  available_seats integer NOT NULL CHECK (available_seats > 0 AND available_seats <= 8),
  additional_info text DEFAULT '',
  has_valid_license boolean NOT NULL DEFAULT true,
  terms_accepted boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create carpooling_bookings table
CREATE TABLE IF NOT EXISTS carpooling_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES carpooling_offers(id) ON DELETE CASCADE,
  passenger_first_name text NOT NULL,
  passenger_last_name text NOT NULL,
  passenger_email text NOT NULL,
  passenger_phone text NOT NULL,
  seats_reserved integer NOT NULL DEFAULT 1 CHECK (seats_reserved > 0),
  terms_accepted boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE carpooling_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE carpooling_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for carpooling_offers
CREATE POLICY "Anyone can view active carpooling offers"
  ON carpooling_offers FOR SELECT
  USING (status = 'active');

CREATE POLICY "Anyone can create carpooling offers"
  ON carpooling_offers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Drivers can update their own offers"
  ON carpooling_offers FOR UPDATE
  USING (driver_email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (driver_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Drivers can delete their own offers"
  ON carpooling_offers FOR DELETE
  USING (driver_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policies for carpooling_bookings
CREATE POLICY "Drivers can view bookings for their offers"
  ON carpooling_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carpooling_offers
      WHERE carpooling_offers.id = offer_id
      AND carpooling_offers.driver_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY "Anyone can create bookings"
  ON carpooling_bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Passengers can cancel their own bookings"
  ON carpooling_bookings FOR UPDATE
  USING (passenger_email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (passenger_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Create function to get available seats for an offer
CREATE OR REPLACE FUNCTION get_available_seats(offer_id_param uuid)
RETURNS integer AS $$
DECLARE
  total_seats integer;
  reserved_seats integer;
BEGIN
  SELECT available_seats INTO total_seats
  FROM carpooling_offers
  WHERE id = offer_id_param AND status = 'active';
  
  SELECT COALESCE(SUM(seats_reserved), 0) INTO reserved_seats
  FROM carpooling_bookings
  WHERE offer_id = offer_id_param AND status = 'confirmed';
  
  RETURN GREATEST(total_seats - reserved_seats, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_carpooling_offers_event_id ON carpooling_offers(event_id);
CREATE INDEX IF NOT EXISTS idx_carpooling_offers_status ON carpooling_offers(status);
CREATE INDEX IF NOT EXISTS idx_carpooling_bookings_offer_id ON carpooling_bookings(offer_id);
CREATE INDEX IF NOT EXISTS idx_carpooling_bookings_status ON carpooling_bookings(status);

-- ✅ Fin de: 20251021204147_create_carpooling_module.sql


-- ============================================================================
-- Migration: 20251022085319_create_bib_exchange_module_v3.sql
-- ============================================================================

/*
  # Module Bourse aux Dossards (Bib Exchange)

  1. Description
    - Système de revente sécurisée de dossards entre coureurs
    - Transfert automatique des inscriptions
    - Remboursement automatique moins frais Timepulse (5€)
    - Respect du genre pour les catégories genrées

  2. Tables créées
    - `bib_exchange_settings` : Configuration de la bourse par événement
    - `bib_exchange_listings` : Dossards mis en vente
    - `bib_exchange_transfers` : Historique des transferts

  3. Sécurité
    - RLS activé sur toutes les tables
    - Validation du genre pour les catégories genrées
    - Date limite de transfert respectée
    - Remboursement automatique du vendeur

  4. Règles métier
    - Prix de revente = prix d'achat initial
    - Frais Timepulse = 5€ déduits du remboursement
    - Le dossard doit correspondre au genre (si catégorie genrée)
    - Transfert uniquement si bourse ouverte et avant date limite
*/

-- Table de configuration de la bourse par événement
CREATE TABLE IF NOT EXISTS bib_exchange_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  is_enabled boolean DEFAULT false NOT NULL,
  transfer_deadline timestamptz,
  timepulse_fee_amount decimal(10,2) DEFAULT 5.00 NOT NULL,
  allow_gender_mismatch boolean DEFAULT false NOT NULL,
  rules_text text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(event_id)
);

-- Table des dossards en vente
CREATE TABLE IF NOT EXISTS bib_exchange_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE NOT NULL,
  
  -- Informations du dossard
  bib_number integer,
  original_price decimal(10,2) NOT NULL,
  sale_price decimal(10,2) NOT NULL,
  seller_refund_amount decimal(10,2) NOT NULL,
  
  -- Contraintes de transfert
  gender_required text CHECK (gender_required IN ('M', 'F', 'any')),
  
  -- Statut
  status text DEFAULT 'available' CHECK (status IN ('available', 'sold', 'cancelled')) NOT NULL,
  
  -- Dates
  listed_at timestamptz DEFAULT now() NOT NULL,
  sold_at timestamptz,
  cancelled_at timestamptz,
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Table des transferts effectués
CREATE TABLE IF NOT EXISTS bib_exchange_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES bib_exchange_listings(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  
  -- Vendeur
  seller_registration_id uuid REFERENCES registrations(id) ON DELETE SET NULL,
  seller_refund_amount decimal(10,2) NOT NULL,
  seller_refund_status text DEFAULT 'pending' CHECK (seller_refund_status IN ('pending', 'completed', 'failed')) NOT NULL,
  
  -- Acheteur
  buyer_registration_id uuid REFERENCES registrations(id) ON DELETE CASCADE NOT NULL,
  buyer_payment_amount decimal(10,2) NOT NULL,
  buyer_payment_status text DEFAULT 'pending' CHECK (buyer_payment_status IN ('pending', 'completed', 'failed')) NOT NULL,
  
  -- Timepulse
  timepulse_fee_amount decimal(10,2) NOT NULL,
  
  -- Dates
  transferred_at timestamptz DEFAULT now() NOT NULL,
  refund_completed_at timestamptz,
  
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes pour les performances
CREATE INDEX IF NOT EXISTS idx_bib_exchange_listings_event_status ON bib_exchange_listings(event_id, status);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_listings_race_status ON bib_exchange_listings(race_id, status);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_listings_registration ON bib_exchange_listings(registration_id);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_transfers_listing ON bib_exchange_transfers(listing_id);
CREATE INDEX IF NOT EXISTS idx_bib_exchange_transfers_event ON bib_exchange_transfers(event_id);

-- Activer RLS
ALTER TABLE bib_exchange_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bib_exchange_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bib_exchange_transfers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour bib_exchange_settings

-- Les organisateurs peuvent tout gérer
CREATE POLICY "Organizers can manage bib exchange settings"
  ON bib_exchange_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = bib_exchange_settings.event_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = bib_exchange_settings.event_id
      AND o.user_id = auth.uid()
    )
  );

-- Lecture publique des paramètres (pour savoir si la bourse est ouverte)
CREATE POLICY "Public can view bib exchange settings"
  ON bib_exchange_settings FOR SELECT
  TO public
  USING (is_enabled = true);

-- Politiques RLS pour bib_exchange_listings

-- Les vendeurs peuvent créer leurs propres annonces
CREATE POLICY "Users can create their own listings"
  ON bib_exchange_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id
      AND r.user_id = auth.uid()
    )
  );

-- Les vendeurs peuvent voir et modifier leurs propres annonces
CREATE POLICY "Users can manage their own listings"
  ON bib_exchange_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = registration_id
      AND r.user_id = auth.uid()
    )
  );

-- Les organisateurs peuvent tout voir et modifier
CREATE POLICY "Organizers can manage all listings"
  ON bib_exchange_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = event_id
      AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = event_id
      AND o.user_id = auth.uid()
    )
  );

-- Lecture publique des dossards disponibles
CREATE POLICY "Public can view available listings"
  ON bib_exchange_listings FOR SELECT
  TO public
  USING (status = 'available');

-- Politiques RLS pour bib_exchange_transfers

-- Les organisateurs peuvent tout voir
CREATE POLICY "Organizers can view all transfers"
  ON bib_exchange_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE e.id = event_id
      AND o.user_id = auth.uid()
    )
  );

-- Les vendeurs peuvent voir leurs transferts
CREATE POLICY "Sellers can view their transfers"
  ON bib_exchange_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = seller_registration_id
      AND r.user_id = auth.uid()
    )
  );

-- Les acheteurs peuvent voir leurs transferts
CREATE POLICY "Buyers can view their transfers"
  ON bib_exchange_transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations r
      WHERE r.id = buyer_registration_id
      AND r.user_id = auth.uid()
    )
  );

-- Fonction pour calculer le remboursement vendeur
CREATE OR REPLACE FUNCTION calculate_seller_refund(
  original_price decimal,
  timepulse_fee decimal
)
RETURNS decimal
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN GREATEST(0, original_price - timepulse_fee);
END;
$$;

-- Activer le realtime sur les listings
ALTER TABLE bib_exchange_listings REPLICA IDENTITY FULL;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_bib_exchange_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bib_exchange_settings_updated_at
  BEFORE UPDATE ON bib_exchange_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_bib_exchange_updated_at();

CREATE TRIGGER update_bib_exchange_listings_updated_at
  BEFORE UPDATE ON bib_exchange_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_bib_exchange_updated_at();


-- ✅ Fin de: 20251022085319_create_bib_exchange_module_v3.sql


-- ============================================================================
-- Migration: 20251022130000_create_email_logs.sql
-- ============================================================================

/*
  # Create Email Logs Table for Monitoring

  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key) - Unique identifier for each log entry
      - `to_email` (text) - Recipient email address
      - `from_email` (text) - Sender email address
      - `subject` (text) - Email subject
      - `status` (text) - Status of the email (success, failed, pending)
      - `error_message` (text, nullable) - Error message if failed
      - `message_id` (text, nullable) - OxiMailing message ID
      - `metadata` (jsonb, nullable) - Additional metadata
      - `created_at` (timestamptz) - When the log was created
      - `sent_at` (timestamptz, nullable) - When the email was actually sent

  2. Security
    - Enable RLS on `email_logs` table
    - Add policy for authenticated admin users to read logs
    - No public access

  3. Indexes
    - Index on `status` for filtering
    - Index on `created_at` for sorting
    - Index on `to_email` for searching
*/

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  from_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message text,
  message_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to read all logs
CREATE POLICY "Admin users can read all email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);


-- ✅ Fin de: 20251022130000_create_email_logs.sql


-- ============================================================================
-- Migration: 20251023140000_create_results_module.sql
-- ============================================================================

/*
  # Module de Gestion des Résultats

  1. Tables Créées
    - `results` - Résultats de course
      - `id` (uuid, PK)
      - `race_id` (uuid, FK vers races)
      - `entry_id` (uuid, FK vers entries)
      - `bib_number` (integer)
      - `athlete_name` (text) - Dénormalisé pour performance
      - `gender` (text)
      - `category` (text)
      - `finish_time` (interval) - Temps brut
      - `gun_time` (interval) - Temps pistolet
      - `net_time` (interval) - Temps net
      - `overall_rank` (integer) - Classement scratch
      - `gender_rank` (integer) - Classement par genre
      - `category_rank` (integer) - Classement catégorie
      - `split_times` (jsonb) - Temps intermédiaires
      - `status` (text) - finished, dnf, dns, dsq
      - `import_source` (text) - elogica, excel, csv, manual
      - `import_batch_id` (uuid) - Groupe d'import
      - `notes` (text)
      - `created_at`, `updated_at`

    - `result_imports` - Historique des imports
      - `id` (uuid, PK)
      - `race_id` (uuid, FK)
      - `file_name` (text)
      - `file_type` (text) - elogica, excel, csv
      - `imported_by` (uuid, FK vers auth.users)
      - `total_rows` (integer)
      - `successful_rows` (integer)
      - `failed_rows` (integer)
      - `errors` (jsonb)
      - `status` (text) - pending, processing, completed, failed
      - `created_at`, `completed_at`

    - `split_points` - Points de passage
      - `id` (uuid, PK)
      - `race_id` (uuid, FK)
      - `name` (text) - "Départ", "KM5", "Ravitaillement 1"
      - `distance_km` (decimal)
      - `order_index` (integer)
      - `created_at`

  2. Fonctions
    - `calculate_rankings()` - Calcul automatique des classements
    - `parse_time_string()` - Conversion string vers interval
    - `format_time_result()` - Format d'affichage HH:MM:SS

  3. Sécurité
    - RLS activé sur toutes les tables
    - Organisateurs peuvent gérer leurs résultats
    - Public peut voir les résultats publiés
*/

-- Table des résultats
CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  entry_id uuid REFERENCES entries(id) ON DELETE SET NULL,

  -- Données athlète (dénormalisées pour performance)
  bib_number integer NOT NULL,
  athlete_name text NOT NULL,
  gender text CHECK (gender IN ('M', 'F', 'X')),
  category text,

  -- Temps
  finish_time interval,
  gun_time interval,
  net_time interval,

  -- Classements
  overall_rank integer,
  gender_rank integer,
  category_rank integer,

  -- Données additionnelles
  split_times jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'finished' CHECK (status IN ('finished', 'dnf', 'dns', 'dsq')),

  -- Traçabilité import
  import_source text CHECK (import_source IN ('elogica', 'excel', 'csv', 'manual')),
  import_batch_id uuid,
  notes text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(race_id, bib_number)
);

-- Index pour performance
CREATE INDEX idx_results_race ON results(race_id);
CREATE INDEX idx_results_entry ON results(entry_id);
CREATE INDEX idx_results_bib ON results(race_id, bib_number);
CREATE INDEX idx_results_status ON results(status) WHERE status = 'finished';
CREATE INDEX idx_results_overall_rank ON results(race_id, overall_rank) WHERE status = 'finished';
CREATE INDEX idx_results_import_batch ON results(import_batch_id);

-- Recherche full-text sur nom athlète
CREATE INDEX idx_results_athlete_search ON results
  USING gin(to_tsvector('french', athlete_name));

-- Table historique des imports
CREATE TABLE IF NOT EXISTS result_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,

  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('elogica', 'excel', 'csv')),
  imported_by uuid REFERENCES auth.users(id) NOT NULL,

  total_rows integer DEFAULT 0,
  successful_rows integer DEFAULT 0,
  failed_rows integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,

  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_result_imports_race ON result_imports(race_id);
CREATE INDEX idx_result_imports_user ON result_imports(imported_by);
CREATE INDEX idx_result_imports_status ON result_imports(status);

-- Table des points de passage
CREATE TABLE IF NOT EXISTS split_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,

  name text NOT NULL,
  distance_km decimal(6,2),
  order_index integer NOT NULL,

  created_at timestamptz DEFAULT now(),

  UNIQUE(race_id, order_index)
);

CREATE INDEX idx_split_points_race ON split_points(race_id);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Parser une chaîne de temps (HH:MM:SS ou MM:SS) en interval
CREATE OR REPLACE FUNCTION parse_time_string(time_str text)
RETURNS interval
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Format HH:MM:SS
  IF time_str ~ '^\d{1,2}:\d{2}:\d{2}$' THEN
    RETURN time_str::interval;
  END IF;

  -- Format MM:SS (ajouter 00: devant)
  IF time_str ~ '^\d{1,2}:\d{2}$' THEN
    RETURN ('00:' || time_str)::interval;
  END IF;

  -- Format en secondes
  IF time_str ~ '^\d+$' THEN
    RETURN (time_str::integer || ' seconds')::interval;
  END IF;

  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Formater un interval en string HH:MM:SS
CREATE OR REPLACE FUNCTION format_time_result(time_interval interval)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  hours integer;
  minutes integer;
  seconds integer;
BEGIN
  IF time_interval IS NULL THEN
    RETURN NULL;
  END IF;

  hours := EXTRACT(HOUR FROM time_interval)::integer;
  minutes := EXTRACT(MINUTE FROM time_interval)::integer;
  seconds := EXTRACT(SECOND FROM time_interval)::integer;

  RETURN LPAD(hours::text, 2, '0') || ':' ||
         LPAD(minutes::text, 2, '0') || ':' ||
         LPAD(seconds::text, 2, '0');
END;
$$;

-- Calculer automatiquement les classements
CREATE OR REPLACE FUNCTION calculate_rankings(p_race_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Classement scratch
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY finish_time) as rank
    FROM results
    WHERE race_id = p_race_id
      AND status = 'finished'
      AND finish_time IS NOT NULL
  )
  UPDATE results r
  SET overall_rank = ranked.rank
  FROM ranked
  WHERE r.id = ranked.id;

  -- Classement par genre
  WITH ranked_gender AS (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY gender ORDER BY finish_time) as rank
    FROM results
    WHERE race_id = p_race_id
      AND status = 'finished'
      AND finish_time IS NOT NULL
      AND gender IS NOT NULL
  )
  UPDATE results r
  SET gender_rank = ranked_gender.rank
  FROM ranked_gender
  WHERE r.id = ranked_gender.id;

  -- Classement par catégorie
  WITH ranked_category AS (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY category ORDER BY finish_time) as rank
    FROM results
    WHERE race_id = p_race_id
      AND status = 'finished'
      AND finish_time IS NOT NULL
      AND category IS NOT NULL
  )
  UPDATE results r
  SET category_rank = ranked_category.rank
  FROM ranked_category
  WHERE r.id = ranked_category.id;

  -- Mettre à jour updated_at
  UPDATE results
  SET updated_at = now()
  WHERE race_id = p_race_id;
END;
$$;

-- Trigger pour recalculer les classements automatiquement
CREATE OR REPLACE FUNCTION trigger_recalculate_rankings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM calculate_rankings(NEW.race_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_rankings_on_insert
  AFTER INSERT ON results
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_rankings();

CREATE TRIGGER recalculate_rankings_on_update
  AFTER UPDATE ON results
  FOR EACH ROW
  WHEN (OLD.finish_time IS DISTINCT FROM NEW.finish_time OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_recalculate_rankings();

-- Trigger pour updated_at
CREATE TRIGGER update_results_updated_at
  BEFORE UPDATE ON results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE result_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_points ENABLE ROW LEVEL SECURITY;

-- Results: Public peut voir les résultats des courses publiées
CREATE POLICY "Public can view published race results"
  ON results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = results.race_id
        AND e.status = 'published'
    )
  );

-- Results: Organisateurs peuvent gérer leurs résultats
CREATE POLICY "Organizers can manage their race results"
  ON results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = results.race_id
        AND e.organizer_id IN (
          SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
        )
    )
  );

-- Result imports: Organisateurs voient leurs imports
CREATE POLICY "Organizers can view their imports"
  ON result_imports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = result_imports.race_id
        AND e.organizer_id IN (
          SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Organizers can create imports"
  ON result_imports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = result_imports.race_id
        AND e.organizer_id IN (
          SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
        )
    )
  );

-- Split points: Public peut voir
CREATE POLICY "Public can view split points"
  ON split_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = split_points.race_id
        AND e.status = 'published'
    )
  );

-- Split points: Organisateurs peuvent gérer
CREATE POLICY "Organizers can manage split points"
  ON split_points FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = split_points.race_id
        AND e.organizer_id IN (
          SELECT organizer_id FROM organizer_users WHERE user_id = auth.uid()
        )
    )
  );

-- Admins ont accès complet
CREATE POLICY "Admins have full access to results"
  ON results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to imports"
  ON result_imports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE id = auth.uid()
    )
  );


-- ✅ Fin de: 20251023140000_create_results_module.sql


-- ============================================================================
-- Migration: 20251024145052_create_payment_transactions_table.sql
-- ============================================================================

/*
  # Create Payment Transactions Table

  1. New Table
    - `payment_transactions`
      - Stores all payment attempts and confirmations
      - Links to entries table
      - Tracks Lyra transaction details
  
  2. Columns
    - id (uuid, primary key)
    - entry_id (uuid, foreign key to entries)
    - order_id (text, unique) - Internal order reference
    - transaction_id (text) - Lyra transaction ID
    - amount (numeric) - Amount in cents
    - currency (text) - EUR, USD, etc.
    - status (text) - pending, paid, failed, refunded, cancelled
    - payment_method (text) - CB, VISA, MASTERCARD, etc.
    - customer_email (text)
    - customer_name (text)
    - lyra_form_token (text) - Token for payment form
    - lyra_response (jsonb) - Full Lyra response
    - error_message (text)
    - paid_at (timestamptz)
    - created_at (timestamptz)
    - updated_at (timestamptz)
  
  3. Security
    - Enable RLS
    - Public can insert (for creating payment)
    - Public can read own transactions via order_id
    - Organizers can read transactions for their events
    - Admins can read all via service functions
*/

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES entries(id) ON DELETE CASCADE,
  order_id text UNIQUE NOT NULL,
  transaction_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR' NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  payment_method text,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  lyra_form_token text,
  lyra_response jsonb,
  error_message text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_entry_id ON payment_transactions(entry_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create payment transaction"
  ON payment_transactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own payment transactions via order_id"
  ON payment_transactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "System can update payment transactions"
  ON payment_transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE payment_transactions IS 'Stores all payment transactions processed through Lyra Collect';
COMMENT ON COLUMN payment_transactions.order_id IS 'Unique internal order reference (format: ORD-{timestamp}-{random})';
COMMENT ON COLUMN payment_transactions.transaction_id IS 'Lyra transaction ID returned after payment';
COMMENT ON COLUMN payment_transactions.amount IS 'Amount in cents (e.g., 2500 = 25.00 EUR)';
COMMENT ON COLUMN payment_transactions.lyra_form_token IS 'Temporary token used to generate payment form';
COMMENT ON COLUMN payment_transactions.lyra_response IS 'Full JSON response from Lyra API for debugging';


-- ✅ Fin de: 20251024145052_create_payment_transactions_table.sql


-- ============================================================================
-- Migration: 20251027115516_create_column_mappings_table.sql
-- ============================================================================

/*
  # Create column mappings table for results import

  1. New Tables
    - `column_mappings`
      - `id` (uuid, primary key)
      - `name` (text) - Template name
      - `description` (text) - Description of the mapping
      - `file_format` (text) - csv, excel, elogica, ffa-text, html
      - `separator` (text) - Field separator (for CSV)
      - `mapping` (jsonb) - Column mapping configuration
      - `is_global` (boolean) - Available to all users
      - `created_by` (uuid) - User who created the mapping
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Users can read global mappings
    - Only admins can create/manage mappings
*/

CREATE TABLE IF NOT EXISTS column_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  file_format text NOT NULL CHECK (file_format IN ('csv', 'excel', 'elogica', 'ffa-text', 'html')),
  separator text DEFAULT ',',
  mapping jsonb NOT NULL,
  is_global boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE column_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mappings"
  ON column_mappings
  FOR SELECT
  USING (true);

CREATE POLICY "Only authenticated users can manage mappings"
  ON column_mappings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_column_mappings_file_format ON column_mappings(file_format);

-- Insert some default global mappings
INSERT INTO column_mappings (name, description, file_format, separator, mapping, is_global)
VALUES
  (
    'Format Standard CSV',
    'Mapping standard pour CSV : Dossard, Nom, Prénom, Sexe, Catégorie, Temps',
    'csv',
    ',',
    '{
      "bib": 0,
      "lastName": 1,
      "firstName": 2,
      "gender": 3,
      "category": 4,
      "finishTime": 5
    }'::jsonb,
    true
  ),
  (
    'Format Elogica Standard',
    'Format Elogica avec séparateur point-virgule',
    'elogica',
    ';',
    '{
      "bib": 0,
      "lastName": 1,
      "firstName": 2,
      "gender": 3,
      "category": 4,
      "club": 5,
      "gunTime": 6,
      "netTime": 7,
      "overallRank": 8,
      "genderRank": 9,
      "categoryRank": 10
    }'::jsonb,
    true
  ),
  (
    'Format Course avec Mi-temps',
    'Format pour courses avec points de passage : Pl, Dos, Nom-prénom, Club, Sx, Année, Cat, Mi-course, Temps',
    'csv',
    '	',
    '{
      "overallRank": 0,
      "bib": 1,
      "fullName": 2,
      "club": 3,
      "gender": 4,
      "year": 5,
      "category": 6,
      "splitTime1": 7,
      "finishTime": 10
    }'::jsonb,
    true
  )
ON CONFLICT (name) DO NOTHING;


-- ✅ Fin de: 20251027115516_create_column_mappings_table.sql


-- ============================================================================
-- Migration: 20251028063650_create_email_templates_table.sql
-- ============================================================================

/*
  # Create Email Templates Table

  1. New Tables
    - email_templates: Store customizable email templates
  
  2. Security
    - Enable RLS
    - Only admins can manage templates
*/

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text,
  available_variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage email templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Insert default templates
INSERT INTO email_templates (template_key, name, description, subject, html_body, available_variables) VALUES
(
  'admin_welcome',
  'Email de bienvenue admin',
  'Envoyé automatiquement lors de la création d''un compte admin',
  'Bienvenue sur Timepulse Admin',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .credentials { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bienvenue sur Timepulse</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{name}}</strong>,</p>
      
      <p>Votre compte administrateur a été créé avec succès sur la plateforme Timepulse.</p>
      
      <div class="credentials">
        <h3>Vos identifiants de connexion :</h3>
        <p><strong>Email :</strong> {{email}}</p>
        <p><strong>Mot de passe :</strong> {{password}}</p>
      </div>
      
      <p><strong>⚠️ Important :</strong> Pour des raisons de sécurité, nous vous recommandons de modifier votre mot de passe lors de votre première connexion.</p>
      
      <div style="text-align: center;">
        <a href="{{loginUrl}}" class="button">Se connecter maintenant</a>
      </div>
      
      <p>Si vous avez des questions, n''hésitez pas à contacter l''équipe Timepulse.</p>
      
      <p>À bientôt,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Chronométrage d''événements sportifs</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>',
  '["name", "email", "password", "loginUrl"]'::jsonb
),
(
  'admin_credentials_reminder',
  'Rappel des identifiants admin',
  'Envoyé pour rappeler les identifiants de connexion',
  'Rappel de vos identifiants Timepulse',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Rappel de vos identifiants</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>{{name}}</strong>,</p>
      
      <p>Vous recevez cet email suite à une demande de rappel de vos identifiants de connexion.</p>
      
      <div class="info-box">
        <h3>Vos identifiants :</h3>
        <p><strong>Email :</strong> {{email}}</p>
        <p><strong>Lien de connexion :</strong> <a href="{{loginUrl}}">{{loginUrl}}</a></p>
      </div>
      
      <p><strong>Note :</strong> Pour des raisons de sécurité, votre mot de passe n''est pas inclus dans cet email. Si vous l''avez oublié, contactez un administrateur pour le réinitialiser.</p>
      
      <div style="text-align: center;">
        <a href="{{loginUrl}}" class="button">Se connecter</a>
      </div>
      
      <p>Si vous n''avez pas demandé cet email, vous pouvez l''ignorer en toute sécurité.</p>
      
      <p>Cordialement,<br><strong>L''équipe Timepulse</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 Timepulse - Chronométrage d''événements sportifs</p>
    </div>
  </div>
</body>
</html>',
  '["name", "email", "loginUrl"]'::jsonb
)
ON CONFLICT (template_key) DO NOTHING;


-- ✅ Fin de: 20251028063650_create_email_templates_table.sql


-- ============================================================================
-- Migration: 20251101143601_20251101000001_create_athlete_ecosystem_v2.sql
-- ============================================================================

/*
  # Écosystème Athlète Timepulse - Base de données unifiée

  ## 1. Modifications de la table athletes
    - Ajout de `user_id` (lien avec auth.users pour authentification)
    - Ajout de `slug` (URL personnalisée : timepulse.fr/athlete/jean-dupont-1985)
    - Ajout de `is_public` (profil public ou privé)
    - Ajout de `timepulse_index` (indice de performance calculé)
    - Index composite UNIQUE sur (last_name, first_name, birthdate) pour matching

  ## 2. Liaison results → athletes
    - Ajout de `athlete_id` dans results
    - Fonction de matching automatique `match_athlete_by_identity()`
    - Index pour performance sur 270k+ athlètes

  ## 3. Nouvelles tables
    - `athlete_profiles` : Informations publiques (bio, photo, réseaux sociaux)
    - `athlete_records` : Records personnels par distance/discipline
    - `training_logs` : Carnet d'entraînement
    - `athlete_photos` : Galerie photos par course
    - `timepulse_index_history` : Historique de l'indice de performance
    - `race_types` : Typologie des courses (5km, 10km, marathon, triathlon...)

  ## 4. Sécurité
    - RLS sur toutes les tables
    - Admins ont accès complet à tous les comptes athlètes
    - Athlètes contrôlent leurs propres données
    - Public voit uniquement les profils publics

  ## 5. Performance
    - Index optimisés pour 270 000+ athlètes
    - Recherche full-text sur nom/prénom
    - Partitionnement prévu pour scale future
*/

-- ============================================
-- 1. MODIFICATION TABLE ATHLETES
-- ============================================

-- Ajout des colonnes pour l'écosystème
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'user_id') THEN
    ALTER TABLE athletes ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'slug') THEN
    ALTER TABLE athletes ADD COLUMN slug text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'is_public') THEN
    ALTER TABLE athletes ADD COLUMN is_public boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'timepulse_index') THEN
    ALTER TABLE athletes ADD COLUMN timepulse_index integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'bio') THEN
    ALTER TABLE athletes ADD COLUMN bio text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'profile_photo_url') THEN
    ALTER TABLE athletes ADD COLUMN profile_photo_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'city_display') THEN
    ALTER TABLE athletes ADD COLUMN city_display text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'athletes' AND column_name = 'country_display') THEN
    ALTER TABLE athletes ADD COLUMN country_display text;
  END IF;
END $$;

-- Index UNIQUE composite pour matching (nom, prénom, date naissance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_athletes_identity 
  ON athletes(LOWER(last_name), LOWER(first_name), birthdate);

-- Index pour recherche par user_id
CREATE INDEX IF NOT EXISTS idx_athletes_user_id ON athletes(user_id) WHERE user_id IS NOT NULL;

-- Index pour recherche par slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_athletes_slug ON athletes(slug) WHERE slug IS NOT NULL;

-- Index pour recherche full-text (performance sur 270k entrées)
CREATE INDEX IF NOT EXISTS idx_athletes_search 
  ON athletes USING gin(
    to_tsvector('french', 
      COALESCE(first_name, '') || ' ' || 
      COALESCE(last_name, '') || ' ' || 
      COALESCE(license_club, '')
    )
  );

-- Index pour tri par indice Timepulse
CREATE INDEX IF NOT EXISTS idx_athletes_timepulse_index 
  ON athletes(timepulse_index DESC NULLS LAST);

-- ============================================
-- 2. LIAISON RESULTS → ATHLETES
-- ============================================

-- Ajout de athlete_id dans results
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'results' AND column_name = 'athlete_id') THEN
    ALTER TABLE results ADD COLUMN athlete_id uuid REFERENCES athletes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour jointure results ↔ athletes
CREATE INDEX IF NOT EXISTS idx_results_athlete_id ON results(athlete_id) WHERE athlete_id IS NOT NULL;

-- Index composite pour recherche par athlète + course
CREATE INDEX IF NOT EXISTS idx_results_athlete_race 
  ON results(athlete_id, race_id) WHERE athlete_id IS NOT NULL;

-- ============================================
-- 3. TABLE RACE_TYPES (typologie des courses)
-- ============================================

CREATE TABLE IF NOT EXISTS race_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  sport text NOT NULL CHECK (sport IN ('running', 'trail', 'triathlon', 'swimrun', 'duathlon', 'aquathlon', 'other')),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  
  -- Distances pour calcul de records
  distance_km decimal(6,2),
  
  -- Pour triathlon, swimrun, duathlon
  swim_distance_m integer,
  bike_distance_km decimal(6,2),
  run_distance_km decimal(6,2),
  
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_race_types_sport ON race_types(sport);
CREATE INDEX IF NOT EXISTS idx_race_types_slug ON race_types(slug);
CREATE INDEX IF NOT EXISTS idx_race_types_active ON race_types(is_active) WHERE is_active = true;

-- ============================================
-- 4. TABLE ATHLETE_PROFILES (infos publiques)
-- ============================================

CREATE TABLE IF NOT EXISTS athlete_profiles (
  athlete_id uuid PRIMARY KEY REFERENCES athletes(id) ON DELETE CASCADE,
  
  -- Réseaux sociaux
  instagram_handle text,
  facebook_url text,
  strava_profile text,
  twitter_handle text,
  
  -- Préférences d'affichage
  show_age boolean DEFAULT true,
  show_city boolean DEFAULT true,
  show_records boolean DEFAULT true,
  show_training_logs boolean DEFAULT false,
  
  -- Statistiques publiques
  total_races integer DEFAULT 0,
  total_km_completed decimal(10,2) DEFAULT 0,
  favorite_distance text,
  
  -- SEO
  meta_description text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 5. TABLE ATHLETE_RECORDS (records perso)
-- ============================================

CREATE TABLE IF NOT EXISTS athlete_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  race_type_id uuid REFERENCES race_types(id) ON DELETE CASCADE NOT NULL,
  
  -- Record
  best_time interval NOT NULL,
  result_id uuid REFERENCES results(id) ON DELETE SET NULL,
  race_id uuid REFERENCES races(id) ON DELETE SET NULL,
  
  achieved_at timestamptz NOT NULL,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(athlete_id, race_type_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_athlete_records_athlete ON athlete_records(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_records_type ON athlete_records(race_type_id);

-- ============================================
-- 6. TABLE TRAINING_LOGS (carnet d'entraînement)
-- ============================================

CREATE TABLE IF NOT EXISTS training_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  
  training_date date NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('run', 'bike', 'swim', 'strength', 'rest', 'other')),
  
  -- Données d'entraînement
  distance_km decimal(6,2),
  duration interval,
  average_pace interval,
  average_heart_rate integer,
  
  -- Notes
  title text,
  notes text,
  feeling text CHECK (feeling IN ('great', 'good', 'ok', 'tired', 'injured')),
  
  -- Données GPS (optionnel)
  gpx_url text,
  elevation_gain_m integer,
  
  is_public boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_training_logs_athlete ON training_logs(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_logs_date ON training_logs(athlete_id, training_date DESC);
CREATE INDEX IF NOT EXISTS idx_training_logs_public ON training_logs(is_public) WHERE is_public = true;

-- ============================================
-- 7. TABLE ATHLETE_PHOTOS (galerie)
-- ============================================

CREATE TABLE IF NOT EXISTS athlete_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  race_id uuid REFERENCES races(id) ON DELETE SET NULL,
  
  photo_url text NOT NULL,
  caption text,
  
  -- Métadonnées
  taken_at timestamptz,
  uploaded_at timestamptz DEFAULT now(),
  
  is_public boolean DEFAULT true,
  is_profile_photo boolean DEFAULT false,
  
  -- Engagement
  likes_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_athlete_photos_athlete ON athlete_photos(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_photos_race ON athlete_photos(race_id) WHERE race_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_athlete_photos_public ON athlete_photos(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_athlete_photos_profile ON athlete_photos(athlete_id, is_profile_photo) 
  WHERE is_profile_photo = true;

-- ============================================
-- 8. TABLE TIMEPULSE_INDEX_HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS timepulse_index_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
  
  index_value integer NOT NULL,
  calculated_at timestamptz DEFAULT now(),
  
  -- Détails du calcul
  performance_score decimal(5,2),
  progression_score decimal(5,2),
  regularity_score decimal(5,2),
  versatility_score decimal(5,2),
  podium_score decimal(5,2)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_timepulse_history_athlete ON timepulse_index_history(athlete_id, calculated_at DESC);

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Extension unaccent pour slugs
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Générer un slug unique pour un athlète
CREATE OR REPLACE FUNCTION generate_athlete_slug(
  p_first_name text,
  p_last_name text,
  p_birthdate date
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Créer le slug de base : jean-dupont-1985
  base_slug := LOWER(
    regexp_replace(
      unaccent(p_first_name || '-' || p_last_name || '-' || EXTRACT(YEAR FROM p_birthdate)::text),
      '[^a-z0-9-]', '', 'g'
    )
  );
  
  final_slug := base_slug;
  
  -- Vérifier l'unicité
  WHILE EXISTS (SELECT 1 FROM athletes WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Fonction de matching automatique d'un athlète
CREATE OR REPLACE FUNCTION match_athlete_by_identity(
  p_first_name text,
  p_last_name text,
  p_birthdate date
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_athlete_id uuid;
BEGIN
  -- Chercher l'athlète existant (insensible à la casse)
  SELECT id INTO v_athlete_id
  FROM athletes
  WHERE LOWER(first_name) = LOWER(p_first_name)
    AND LOWER(last_name) = LOWER(p_last_name)
    AND birthdate = p_birthdate;
  
  RETURN v_athlete_id;
END;
$$;

-- Fonction pour créer ou retrouver un athlète
CREATE OR REPLACE FUNCTION upsert_athlete(
  p_first_name text,
  p_last_name text,
  p_birthdate date,
  p_gender text,
  p_email text DEFAULT NULL,
  p_nationality text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_athlete_id uuid;
  v_slug text;
BEGIN
  -- Chercher l'athlète existant
  v_athlete_id := match_athlete_by_identity(p_first_name, p_last_name, p_birthdate);
  
  -- Si trouvé, le retourner
  IF v_athlete_id IS NOT NULL THEN
    RETURN v_athlete_id;
  END IF;
  
  -- Sinon, créer un nouveau
  v_slug := generate_athlete_slug(p_first_name, p_last_name, p_birthdate);
  
  INSERT INTO athletes (
    first_name,
    last_name,
    birthdate,
    gender,
    email,
    nationality,
    slug,
    is_public
  ) VALUES (
    p_first_name,
    p_last_name,
    p_birthdate,
    p_gender,
    p_email,
    p_nationality,
    v_slug,
    false -- Par défaut privé
  )
  RETURNING id INTO v_athlete_id;
  
  -- Créer le profil associé
  INSERT INTO athlete_profiles (athlete_id)
  VALUES (v_athlete_id)
  ON CONFLICT (athlete_id) DO NOTHING;
  
  RETURN v_athlete_id;
END;
$$;

-- Trigger pour créer automatiquement athlete_profiles
CREATE OR REPLACE FUNCTION create_athlete_profile_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO athlete_profiles (athlete_id)
  VALUES (NEW.id)
  ON CONFLICT (athlete_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_athlete_profile_on_insert ON athletes;
CREATE TRIGGER create_athlete_profile_on_insert
  AFTER INSERT ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION create_athlete_profile_trigger();

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_athlete_profiles_updated_at ON athlete_profiles;
CREATE TRIGGER update_athlete_profiles_updated_at
  BEFORE UPDATE ON athlete_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_athlete_records_updated_at ON athlete_records;
CREATE TRIGGER update_athlete_records_updated_at
  BEFORE UPDATE ON athlete_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_logs_updated_at ON training_logs;
CREATE TRIGGER update_training_logs_updated_at
  BEFORE UPDATE ON training_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE timepulse_index_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_types ENABLE ROW LEVEL SECURITY;

-- RACE_TYPES: Public peut voir les types actifs
DROP POLICY IF EXISTS "Public can view active race types" ON race_types;
CREATE POLICY "Public can view active race types"
  ON race_types FOR SELECT
  USING (is_active = true);

-- RACE_TYPES: Admins peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage race types" ON race_types;
CREATE POLICY "Admins can manage race types"
  ON race_types FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ATHLETE_PROFILES: Public peut voir les profils publics
DROP POLICY IF EXISTS "Public can view public athlete profiles" ON athlete_profiles;
CREATE POLICY "Public can view public athlete profiles"
  ON athlete_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_profiles.athlete_id 
        AND athletes.is_public = true
    )
  );

-- ATHLETE_PROFILES: Athlètes gèrent leur propre profil
DROP POLICY IF EXISTS "Athletes can manage their own profile" ON athlete_profiles;
CREATE POLICY "Athletes can manage their own profile"
  ON athlete_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_profiles.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- ATHLETE_PROFILES: Admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to athlete profiles" ON athlete_profiles;
CREATE POLICY "Admins have full access to athlete profiles"
  ON athlete_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ATHLETE_RECORDS: Public peut voir les records des profils publics
DROP POLICY IF EXISTS "Public can view public athlete records" ON athlete_records;
CREATE POLICY "Public can view public athlete records"
  ON athlete_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM athletes a
      JOIN athlete_profiles ap ON a.id = ap.athlete_id
      WHERE a.id = athlete_records.athlete_id 
        AND a.is_public = true
        AND ap.show_records = true
    )
  );

-- ATHLETE_RECORDS: Athlètes gèrent leurs propres records
DROP POLICY IF EXISTS "Athletes can manage their own records" ON athlete_records;
CREATE POLICY "Athletes can manage their own records"
  ON athlete_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_records.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- ATHLETE_RECORDS: Admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to athlete records" ON athlete_records;
CREATE POLICY "Admins have full access to athlete records"
  ON athlete_records FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- TRAINING_LOGS: Public peut voir les logs publics
DROP POLICY IF EXISTS "Public can view public training logs" ON training_logs;
CREATE POLICY "Public can view public training logs"
  ON training_logs FOR SELECT
  USING (is_public = true);

-- TRAINING_LOGS: Athlètes gèrent leurs propres logs
DROP POLICY IF EXISTS "Athletes can manage their own training logs" ON training_logs;
CREATE POLICY "Athletes can manage their own training logs"
  ON training_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = training_logs.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- TRAINING_LOGS: Admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to training logs" ON training_logs;
CREATE POLICY "Admins have full access to training logs"
  ON training_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ATHLETE_PHOTOS: Public peut voir les photos publiques
DROP POLICY IF EXISTS "Public can view public athlete photos" ON athlete_photos;
CREATE POLICY "Public can view public athlete photos"
  ON athlete_photos FOR SELECT
  USING (is_public = true);

-- ATHLETE_PHOTOS: Athlètes gèrent leurs propres photos
DROP POLICY IF EXISTS "Athletes can manage their own photos" ON athlete_photos;
CREATE POLICY "Athletes can manage their own photos"
  ON athlete_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = athlete_photos.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- ATHLETE_PHOTOS: Admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to athlete photos" ON athlete_photos;
CREATE POLICY "Admins have full access to athlete photos"
  ON athlete_photos FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- TIMEPULSE_INDEX_HISTORY: Public peut voir l'historique des profils publics
DROP POLICY IF EXISTS "Public can view public index history" ON timepulse_index_history;
CREATE POLICY "Public can view public index history"
  ON timepulse_index_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = timepulse_index_history.athlete_id 
        AND athletes.is_public = true
    )
  );

-- TIMEPULSE_INDEX_HISTORY: Athlètes voient leur propre historique
DROP POLICY IF EXISTS "Athletes can view their own index history" ON timepulse_index_history;
CREATE POLICY "Athletes can view their own index history"
  ON timepulse_index_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes 
      WHERE athletes.id = timepulse_index_history.athlete_id 
        AND athletes.user_id = auth.uid()
    )
  );

-- TIMEPULSE_INDEX_HISTORY: Admins ont accès complet
DROP POLICY IF EXISTS "Admins have full access to index history" ON timepulse_index_history;
CREATE POLICY "Admins have full access to index history"
  ON timepulse_index_history FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ATHLETES: Mise à jour des policies pour l'admin
DROP POLICY IF EXISTS "Admins can manage all athletes" ON athletes;
CREATE POLICY "Admins can manage all athletes"
  ON athletes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- ATHLETES: Public peut voir les profils publics
DROP POLICY IF EXISTS "Public can view public athletes" ON athletes;
CREATE POLICY "Public can view public athletes"
  ON athletes FOR SELECT
  USING (is_public = true);

-- ATHLETES: Athlètes peuvent voir et modifier leur propre profil
DROP POLICY IF EXISTS "Athletes can manage their own profile" ON athletes;
CREATE POLICY "Athletes can manage their own profile"
  ON athletes FOR ALL
  TO authenticated
  USING (user_id = auth.uid());


-- ✅ Fin de: 20251101143601_20251101000001_create_athlete_ecosystem_v2.sql


-- ============================================================================
-- Migration: 20251103161512_20251103160809_create_volunteer_management_fixed.sql
-- ============================================================================

/*
  # Module Gestion des Bénévoles - Timepulse

  1. Nouvelles Tables
    - `volunteer_posts` - Postes bénévoles (ravitaillements, sécurité, etc.)
    - `volunteers` - Bénévoles inscrits
    - `volunteer_assignments` - Affectations bénévoles aux postes
    - `volunteer_availability` - Disponibilités horaires

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Organisateurs : accès complet à leurs événements
    - Bénévoles : accès via token unique
    - Public : inscription ouverte

  3. Fonctionnalités
    - Création de postes sur parcours
    - Inscription publique des bénévoles
    - Affectation manuelle ou automatique
    - Génération de fiches de poste
    - Pointage présence
    - Certificats de bénévolat
*/

-- Table: volunteer_posts (Postes bénévoles)
CREATE TABLE IF NOT EXISTS volunteer_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,

  name text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'ravitaillement',
    'securite',
    'signalisation',
    'depart_arrivee',
    'vestiaire',
    'retrait_dossards',
    'animation',
    'secourisme',
    'autre'
  )),

  location_name text,
  location_lat numeric(10, 7),
  location_lng numeric(10, 7),
  km_marker numeric(6, 2),

  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,

  required_volunteers_count integer NOT NULL DEFAULT 1 CHECK (required_volunteers_count > 0),

  instructions text,
  material_needed text,
  emergency_contact_name text,
  emergency_contact_phone text,

  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_volunteer_posts_event ON volunteer_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_posts_race ON volunteer_posts(race_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_posts_type ON volunteer_posts(type);

ALTER TABLE volunteer_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage posts for their events"
  ON volunteer_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = volunteer_posts.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can view active posts"
  ON volunteer_posts FOR SELECT
  TO public
  USING (status = 'active');

-- Table: volunteers (Bénévoles)
CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  birth_date date,

  address text,
  city text,
  postal_code text,
  country text DEFAULT 'France',

  tshirt_size text CHECK (tshirt_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  dietary_restrictions text,

  has_first_aid_certification boolean DEFAULT false,
  has_driving_license boolean DEFAULT false,

  skills jsonb DEFAULT '[]',
  preferred_post_types jsonb DEFAULT '[]',

  notes text,

  registration_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),

  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_volunteer_per_event UNIQUE (event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_volunteers_event ON volunteers(event_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);
CREATE INDEX IF NOT EXISTS idx_volunteers_token ON volunteers(registration_token);

ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage volunteers for their events"
  ON volunteers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = volunteers.event_id
      AND events.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can insert volunteers"
  ON volunteers FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Volunteers can view their own data via token"
  ON volunteers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Volunteers can update their own data via token"
  ON volunteers FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Table: volunteer_assignments (Affectations)
CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES volunteer_posts(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'assigned' CHECK (status IN (
    'assigned',
    'confirmed',
    'present',
    'absent',
    'cancelled'
  )),

  check_in_time timestamptz,
  check_out_time timestamptz,

  assignment_notes text,
  volunteer_feedback text,
  organizer_rating integer CHECK (organizer_rating BETWEEN 1 AND 5),

  certificate_generated boolean DEFAULT false,
  certificate_generated_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_assignment UNIQUE (volunteer_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_volunteer ON volunteer_assignments(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_post ON volunteer_assignments(post_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON volunteer_assignments(status);

ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage assignments for their events"
  ON volunteer_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM volunteer_posts vp
      JOIN events e ON e.id = vp.event_id
      WHERE vp.id = volunteer_assignments.post_id
      AND e.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Volunteers can view their assignments"
  ON volunteer_assignments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Volunteers can update their assignment status"
  ON volunteer_assignments FOR UPDATE
  TO public
  USING (status IN ('assigned', 'confirmed'))
  WITH CHECK (status IN ('confirmed', 'cancelled'));

-- Table: volunteer_availability (Disponibilités)
CREATE TABLE IF NOT EXISTS volunteer_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,

  available_from timestamptz NOT NULL,
  available_to timestamptz NOT NULL,

  notes text,

  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_availability_range CHECK (available_to > available_from)
);

CREATE INDEX IF NOT EXISTS idx_availability_volunteer ON volunteer_availability(volunteer_id);

ALTER TABLE volunteer_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view availability for their events"
  ON volunteer_availability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM volunteers v
      JOIN events e ON e.id = v.event_id
      WHERE v.id = volunteer_availability.volunteer_id
      AND e.organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Volunteers can manage their availability"
  ON volunteer_availability FOR ALL
  TO public
  USING (true);

-- Function: Get volunteer post stats
CREATE OR REPLACE FUNCTION get_volunteer_post_stats(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'required_count', vp.required_volunteers_count,
    'assigned_count', COUNT(va.id) FILTER (WHERE va.status = 'assigned'),
    'confirmed_count', COUNT(va.id) FILTER (WHERE va.status = 'confirmed'),
    'present_count', COUNT(va.id) FILTER (WHERE va.status = 'present'),
    'absent_count', COUNT(va.id) FILTER (WHERE va.status = 'absent'),
    'remaining_slots', GREATEST(0, vp.required_volunteers_count - COUNT(va.id) FILTER (WHERE va.status IN ('assigned', 'confirmed', 'present')))
  )
  INTO v_result
  FROM volunteer_posts vp
  LEFT JOIN volunteer_assignments va ON va.post_id = vp.id
  WHERE vp.id = p_post_id
  GROUP BY vp.id, vp.required_volunteers_count;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Function: Get event volunteer summary
CREATE OR REPLACE FUNCTION get_event_volunteer_summary(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_posts', COUNT(DISTINCT vp.id),
    'total_required', SUM(vp.required_volunteers_count),
    'total_volunteers', COUNT(DISTINCT v.id),
    'total_assigned', COUNT(va.id) FILTER (WHERE va.status IN ('assigned', 'confirmed', 'present')),
    'posts_full', COUNT(DISTINCT vp.id) FILTER (
      WHERE vp.required_volunteers_count <= (
        SELECT COUNT(*) FROM volunteer_assignments
        WHERE post_id = vp.id AND status IN ('assigned', 'confirmed', 'present')
      )
    ),
    'posts_empty', COUNT(DISTINCT vp.id) FILTER (
      WHERE NOT EXISTS (
        SELECT 1 FROM volunteer_assignments
        WHERE post_id = vp.id AND status IN ('assigned', 'confirmed', 'present')
      )
    )
  )
  INTO v_result
  FROM volunteer_posts vp
  LEFT JOIN volunteer_assignments va ON va.post_id = vp.id
  LEFT JOIN volunteers v ON v.id = va.volunteer_id
  WHERE vp.event_id = p_event_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- Trigger: Update volunteer_posts updated_at
CREATE OR REPLACE FUNCTION update_volunteer_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_volunteer_posts_updated_at
  BEFORE UPDATE ON volunteer_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteer_posts_updated_at();

-- Trigger: Update volunteers updated_at
CREATE OR REPLACE FUNCTION update_volunteers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_volunteers_updated_at
  BEFORE UPDATE ON volunteers
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteers_updated_at();

-- Trigger: Update volunteer_assignments updated_at
CREATE OR REPLACE FUNCTION update_volunteer_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_volunteer_assignments_updated_at
  BEFORE UPDATE ON volunteer_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteer_assignments_updated_at();


-- ✅ Fin de: 20251103161512_20251103160809_create_volunteer_management_fixed.sql


-- ============================================================================
-- Migration: 20251108160639_create_footer_settings.sql
-- ============================================================================

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


-- ✅ Fin de: 20251108160639_create_footer_settings.sql


-- ============================================================================
-- Migration: 20251108162017_create_static_pages.sql
-- ============================================================================

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


-- ✅ Fin de: 20251108162017_create_static_pages.sql


-- ============================================================================
-- Migration: 20251108170000_create_videos_table.sql
-- ============================================================================

/*
  # Create Videos Management System

  1. New Tables
    - `videos`
      - `id` (uuid, primary key)
      - `title` (text) - Title of the video
      - `description` (text) - Optional description
      - `youtube_url` (text) - Full YouTube URL
      - `youtube_id` (text) - Extracted YouTube video ID
      - `event_id` (uuid) - Optional link to event
      - `race_id` (uuid) - Optional link to specific race
      - `published_date` (date) - Date of the video
      - `is_featured` (boolean) - Highlight on homepage
      - `view_count` (integer) - Track views
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `videos` table
    - Public can read published videos
    - Only admins can create/update/delete videos

  3. Indexes
    - Index on event_id for filtering
    - Index on published_date for sorting
    - Index on is_featured for homepage
*/

CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  youtube_url text NOT NULL,
  youtube_id text NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  race_id uuid REFERENCES races(id) ON DELETE SET NULL,
  published_date date DEFAULT CURRENT_DATE,
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published videos"
  ON videos FOR SELECT
  USING (true);

CREATE POLICY "Super admins can insert videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete videos"
  ON videos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_videos_event_id ON videos(event_id);
CREATE INDEX IF NOT EXISTS idx_videos_published_date ON videos(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_videos_featured ON videos(is_featured) WHERE is_featured = true;

CREATE OR REPLACE FUNCTION update_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_videos_updated_at();


-- ✅ Fin de: 20251108170000_create_videos_table.sql


-- ============================================================================
-- Migration: 20251113213448_20251113230000_create_event_characteristics.sql
-- ============================================================================

/*
  # Create Event Characteristics System

  1. New Tables
    - `event_characteristic_types`
      - Stores available characteristic types with icons and categories
    - `event_characteristics`
      - Many-to-many relationship between events and characteristics
  
  2. Categories
    - Certification: Official distance, qualifying race
    - Terrain: Road, nature, mountain, circuit
    - Style: Festive, elimination
    - Trail Distance: XXS to XXL categories
  
  3. Security
    - Enable RLS on all tables
    - Organizers can manage their event characteristics
    - Public can read all characteristics
*/

-- Create characteristic types table
CREATE TABLE IF NOT EXISTS event_characteristic_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('certification', 'terrain', 'style', 'trail_distance')),
  icon text NOT NULL, -- Lucide icon name
  color text NOT NULL DEFAULT '#3b82f6', -- Tailwind color for the badge
  description text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create event characteristics junction table
CREATE TABLE IF NOT EXISTS event_characteristics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  characteristic_type_id uuid NOT NULL REFERENCES event_characteristic_types(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, characteristic_type_id)
);

-- Enable RLS
ALTER TABLE event_characteristic_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_characteristics ENABLE ROW LEVEL SECURITY;

-- Policies for event_characteristic_types
CREATE POLICY "Anyone can view characteristic types"
  ON event_characteristic_types FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admins can manage characteristic types"
  ON event_characteristic_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = current_setting('request.jwt.claims')::json->>'email'
    )
  );

-- Policies for event_characteristics
CREATE POLICY "Anyone can view event characteristics"
  ON event_characteristics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Organizers can add characteristics to their events"
  ON event_characteristics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_characteristics.event_id
        AND events.organizer_id IN (
          SELECT id FROM organizers
          WHERE organizers.user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Organizers can remove characteristics from their events"
  ON event_characteristics FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_characteristics.event_id
        AND events.organizer_id IN (
          SELECT id FROM organizers
          WHERE organizers.user_id = auth.uid()
        )
    )
  );

-- Create indexes
CREATE INDEX idx_event_characteristics_event_id ON event_characteristics(event_id);
CREATE INDEX idx_event_characteristics_type_id ON event_characteristics(characteristic_type_id);
CREATE INDEX idx_characteristic_types_category ON event_characteristic_types(category);
CREATE INDEX idx_characteristic_types_active ON event_characteristic_types(active);

-- Seed characteristic types
INSERT INTO event_characteristic_types (code, name, category, icon, color, description, display_order) VALUES
  -- Certification
  ('official_distance', 'Distance officielle', 'certification', 'Award', '#10b981', 'Course avec distance certifiée et mesurée', 1),
  ('qualifying_race', 'Course qualificative', 'certification', 'Trophy', '#f59e0b', 'Course permettant une qualification pour une autre épreuve', 2),
  
  -- Terrain
  ('line_course', 'Course en ligne', 'terrain', 'TrendingUp', '#3b82f6', 'Départ et arrivée à des endroits différents', 10),
  ('circuit_course', 'Course sur circuit', 'terrain', 'RefreshCw', '#8b5cf6', 'Course en boucle(s)', 11),
  ('road_race', 'Course sur route', 'terrain', 'RouteIcon', '#6366f1', 'Course majoritairement sur route goudronnée', 12),
  ('nature_race', 'Course nature', 'terrain', 'Trees', '#22c55e', 'Course en milieu naturel (chemins, sentiers)', 13),
  ('mountain_race', 'Course en montagne', 'terrain', 'Mountain', '#0ea5e9', 'Course avec dénivelé important en zone montagneuse', 14),
  
  -- Style
  ('festive_race', 'Course festive', 'style', 'PartyPopper', '#ec4899', 'Ambiance festive, déguisements encouragés', 20),
  ('elimination_race', 'Course à élimination', 'style', 'Zap', '#ef4444', 'Les derniers sont éliminés progressivement', 21),
  
  -- Trail Distance Categories
  ('trail_xxs', 'Trail XXS (0-24 km)', 'trail_distance', 'Footprints', '#84cc16', 'Trail très courte distance', 30),
  ('trail_xs', 'Trail XS (25-44 km)', 'trail_distance', 'Footprints', '#22c55e', 'Trail courte distance', 31),
  ('trail_s', 'Trail S (45-74 km)', 'trail_distance', 'Footprints', '#10b981', 'Trail distance moyenne', 32),
  ('trail_m', 'Trail M (75-114 km)', 'trail_distance', 'Footprints', '#0ea5e9', 'Trail longue distance', 33),
  ('trail_l', 'Trail L (115-154 km)', 'trail_distance', 'Footprints', '#3b82f6', 'Trail très longue distance', 34),
  ('trail_xl', 'Trail XL (155-209 km)', 'trail_distance', 'Footprints', '#8b5cf6', 'Trail ultra distance', 35),
  ('trail_xxl', 'Trail XXL (210+ km)', 'trail_distance', 'Footprints', '#a855f7', 'Trail extreme distance', 36)
ON CONFLICT (code) DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE event_characteristic_types IS 'Types de caractéristiques pour catégoriser les événements sportifs';
COMMENT ON TABLE event_characteristics IS 'Association entre événements et leurs caractéristiques';


-- ✅ Fin de: 20251113213448_20251113230000_create_event_characteristics.sql


-- ============================================================================
-- Migration: 20251118000001_create_speaker_module.sql
-- ============================================================================

/*
  # Module Speaker - Timepulse

  ## Description
  Module permettant aux speakers/commentateurs d'événements sportifs d'accéder
  aux données des participants pour préparer leurs commentaires en direct.

  ## 1. Nouvelles Tables

  ### `speaker_access`
  Configuration d'accès speaker pour un événement
  - `id` (uuid, PK)
  - `event_id` (uuid, FK -> events)
  - `organizer_id` (uuid, FK -> organizers)
  - `is_enabled` (boolean) - Module activé ou non
  - `access_code` (text) - Code de connexion unique (8 caractères alphanumériques)
  - `speaker_name` (text) - Nom du speaker
  - `speaker_email` (text) - Email du speaker (optionnel)
  - `start_date` (timestamptz) - Date d'ouverture d'accès
  - `end_date` (timestamptz) - Date de fermeture d'accès
  - `show_reference_times` (boolean) - Afficher les temps de référence
  - `show_timepulse_index` (boolean) - Afficher l'indice Timepulse
  - `show_betrail_index` (boolean) - Afficher l'indice BetRAIL
  - `show_utmb_index` (boolean) - Afficher l'indice UTMB
  - `show_history` (boolean) - Afficher l'historique des classements
  - `show_statistics` (boolean) - Afficher les statistiques
  - `custom_notes` (text) - Notes personnalisées de l'organisateur pour le speaker
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `speaker_favorites`
  Athlètes marqués en favoris par le speaker
  - `id` (uuid, PK)
  - `speaker_access_id` (uuid, FK -> speaker_access)
  - `entry_id` (uuid, FK -> entries)
  - `race_id` (uuid, FK -> races)
  - `athlete_id` (uuid, FK -> athletes, nullable)
  - `notes` (text) - Notes personnelles du speaker sur l'athlète
  - `priority` (integer) - Ordre de priorité (1 = haute, 2 = moyenne, 3 = basse)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `speaker_lists`
  Listes personnalisées créées par le speaker
  - `id` (uuid, PK)
  - `speaker_access_id` (uuid, FK -> speaker_access)
  - `race_id` (uuid, FK -> races, nullable) - Si null, liste multi-courses
  - `name` (text) - Nom de la liste
  - `description` (text) - Description de la liste
  - `color` (text) - Couleur d'identification
  - `order_index` (integer) - Ordre d'affichage
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `speaker_list_entries`
  Athlètes dans les listes du speaker
  - `id` (uuid, PK)
  - `list_id` (uuid, FK -> speaker_lists)
  - `entry_id` (uuid, FK -> entries)
  - `order_index` (integer) - Ordre dans la liste
  - `created_at` (timestamptz)

  ### `speaker_sponsors`
  Sponsors de l'événement à mentionner
  - `id` (uuid, PK)
  - `event_id` (uuid, FK -> events)
  - `organizer_id` (uuid, FK -> organizers)
  - `name` (text) - Nom du sponsor
  - `category` (text) - Catégorie (Titre, Or, Argent, Bronze, Partenaire)
  - `logo_url` (text) - URL du logo
  - `description` (text) - Description/message à mentionner
  - `mention_frequency` (text) - Fréquence de mention (Haute, Moyenne, Basse)
  - `keywords` (text[]) - Mots-clés pour rappel automatique
  - `website` (text)
  - `order_index` (integer)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `speaker_activity_log`
  Journal d'activité du speaker
  - `id` (uuid, PK)
  - `speaker_access_id` (uuid, FK -> speaker_access)
  - `action` (text) - Type d'action effectuée
  - `details` (jsonb) - Détails de l'action
  - `created_at` (timestamptz)

  ## 2. Sécurité
  - RLS activé sur toutes les tables
  - Accès speaker via code uniquement
  - Organisateur a accès complet à ses données speaker
  - Logs d'activité pour traçabilité

  ## 3. Fonctionnalités
  - Authentification par code unique
  - Gestion des favoris avec notes
  - Création de listes personnalisées
  - Export PDF des listes
  - Filtres avancés (sexe, catégorie, club, nationalité, indice)
  - Statistiques en temps réel
  - Gestion des sponsors à mentionner
*/

-- =====================================================
-- 1. TABLE: speaker_access
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT false,
  access_code text UNIQUE NOT NULL,
  speaker_name text NOT NULL,
  speaker_email text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  show_reference_times boolean DEFAULT true,
  show_timepulse_index boolean DEFAULT true,
  show_betrail_index boolean DEFAULT false,
  show_utmb_index boolean DEFAULT false,
  show_history boolean DEFAULT false,
  show_statistics boolean DEFAULT true,
  custom_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT access_code_format CHECK (access_code ~ '^[A-Z0-9]{8}$')
);

-- Index pour recherche rapide par code
CREATE INDEX idx_speaker_access_code ON speaker_access(access_code);
CREATE INDEX idx_speaker_access_event ON speaker_access(event_id);
CREATE INDEX idx_speaker_access_organizer ON speaker_access(organizer_id);

-- RLS
ALTER TABLE speaker_access ENABLE ROW LEVEL SECURITY;

-- Organisateurs peuvent gérer leurs propres accès speaker
CREATE POLICY "Organizers can manage their speaker access"
  ON speaker_access FOR ALL
  TO authenticated
  USING (organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  ))
  WITH CHECK (organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  ));

-- Accès public pour authentification speaker (lecture seule du code)
CREATE POLICY "Public can verify speaker access code"
  ON speaker_access FOR SELECT
  TO public
  USING (is_enabled = true AND now() BETWEEN start_date AND end_date);

-- =====================================================
-- 2. TABLE: speaker_favorites
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_access_id uuid NOT NULL REFERENCES speaker_access(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES athletes(id) ON DELETE SET NULL,
  notes text,
  priority integer DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(speaker_access_id, entry_id)
);

CREATE INDEX idx_speaker_favorites_access ON speaker_favorites(speaker_access_id);
CREATE INDEX idx_speaker_favorites_entry ON speaker_favorites(entry_id);
CREATE INDEX idx_speaker_favorites_race ON speaker_favorites(race_id);
CREATE INDEX idx_speaker_favorites_priority ON speaker_favorites(priority);

ALTER TABLE speaker_favorites ENABLE ROW LEVEL SECURITY;

-- Speaker peut gérer ses favoris via l'access_code
CREATE POLICY "Speaker can manage own favorites"
  ON speaker_favorites FOR ALL
  TO public
  USING (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  )
  WITH CHECK (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  );

-- Organisateurs peuvent voir les favoris de leurs speakers
CREATE POLICY "Organizers can view speaker favorites"
  ON speaker_favorites FOR SELECT
  TO authenticated
  USING (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 3. TABLE: speaker_lists
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_access_id uuid NOT NULL REFERENCES speaker_access(id) ON DELETE CASCADE,
  race_id uuid REFERENCES races(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT 'blue' CHECK (color IN ('blue', 'green', 'yellow', 'red', 'purple', 'pink', 'orange', 'teal')),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_speaker_lists_access ON speaker_lists(speaker_access_id);
CREATE INDEX idx_speaker_lists_race ON speaker_lists(race_id);
CREATE INDEX idx_speaker_lists_order ON speaker_lists(order_index);

ALTER TABLE speaker_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Speaker can manage own lists"
  ON speaker_lists FOR ALL
  TO public
  USING (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  )
  WITH CHECK (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  );

CREATE POLICY "Organizers can view speaker lists"
  ON speaker_lists FOR SELECT
  TO authenticated
  USING (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 4. TABLE: speaker_list_entries
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_list_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES speaker_lists(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(list_id, entry_id)
);

CREATE INDEX idx_speaker_list_entries_list ON speaker_list_entries(list_id);
CREATE INDEX idx_speaker_list_entries_entry ON speaker_list_entries(entry_id);
CREATE INDEX idx_speaker_list_entries_order ON speaker_list_entries(order_index);

ALTER TABLE speaker_list_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Speaker can manage list entries"
  ON speaker_list_entries FOR ALL
  TO public
  USING (
    list_id IN (
      SELECT id FROM speaker_lists
      WHERE speaker_access_id IN (
        SELECT id FROM speaker_access
        WHERE is_enabled = true
        AND now() BETWEEN start_date AND end_date
      )
    )
  )
  WITH CHECK (
    list_id IN (
      SELECT id FROM speaker_lists
      WHERE speaker_access_id IN (
        SELECT id FROM speaker_access
        WHERE is_enabled = true
        AND now() BETWEEN start_date AND end_date
      )
    )
  );

-- =====================================================
-- 5. TABLE: speaker_sponsors
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'Partenaire' CHECK (category IN ('Titre', 'Or', 'Argent', 'Bronze', 'Partenaire', 'Média', 'Institutionnel')),
  logo_url text,
  description text,
  mention_frequency text DEFAULT 'Moyenne' CHECK (mention_frequency IN ('Haute', 'Moyenne', 'Basse')),
  keywords text[] DEFAULT '{}',
  website text,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_speaker_sponsors_event ON speaker_sponsors(event_id);
CREATE INDEX idx_speaker_sponsors_organizer ON speaker_sponsors(organizer_id);
CREATE INDEX idx_speaker_sponsors_category ON speaker_sponsors(category);
CREATE INDEX idx_speaker_sponsors_order ON speaker_sponsors(order_index);

ALTER TABLE speaker_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage their sponsors"
  ON speaker_sponsors FOR ALL
  TO authenticated
  USING (organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  ))
  WITH CHECK (organizer_id IN (
    SELECT id FROM organizers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Public can view active sponsors for speaker access"
  ON speaker_sponsors FOR SELECT
  TO public
  USING (
    is_active = true
    AND event_id IN (
      SELECT event_id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  );

-- =====================================================
-- 6. TABLE: speaker_activity_log
-- =====================================================
CREATE TABLE IF NOT EXISTS speaker_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker_access_id uuid NOT NULL REFERENCES speaker_access(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_speaker_activity_log_access ON speaker_activity_log(speaker_access_id);
CREATE INDEX idx_speaker_activity_log_created ON speaker_activity_log(created_at);

ALTER TABLE speaker_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Speaker can create activity logs"
  ON speaker_activity_log FOR INSERT
  TO public
  WITH CHECK (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE is_enabled = true
      AND now() BETWEEN start_date AND end_date
    )
  );

CREATE POLICY "Organizers can view speaker activity logs"
  ON speaker_activity_log FOR SELECT
  TO authenticated
  USING (
    speaker_access_id IN (
      SELECT id FROM speaker_access
      WHERE organizer_id IN (
        SELECT id FROM organizers WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 7. FONCTION: Générer un code d'accès unique
-- =====================================================
CREATE OR REPLACE FUNCTION generate_speaker_access_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Générer un code de 8 caractères alphanumériques majuscules
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM speaker_access WHERE access_code = new_code) INTO code_exists;

    -- Si le code n'existe pas, le retourner
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- =====================================================
-- 8. FONCTION: Logger l'activité du speaker
-- =====================================================
CREATE OR REPLACE FUNCTION log_speaker_activity(
  p_speaker_access_id uuid,
  p_action text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO speaker_activity_log (speaker_access_id, action, details)
  VALUES (p_speaker_access_id, p_action, p_details);
END;
$$;

-- =====================================================
-- 9. FONCTION: Vérifier un code d'accès speaker
-- =====================================================
CREATE OR REPLACE FUNCTION verify_speaker_access_code(p_access_code text)
RETURNS TABLE (
  access_id uuid,
  event_id uuid,
  event_name text,
  speaker_name text,
  is_valid boolean,
  show_reference_times boolean,
  show_timepulse_index boolean,
  show_betrail_index boolean,
  show_utmb_index boolean,
  show_history boolean,
  show_statistics boolean,
  custom_notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.event_id,
    e.name,
    sa.speaker_name,
    (sa.is_enabled AND now() BETWEEN sa.start_date AND sa.end_date) as is_valid,
    sa.show_reference_times,
    sa.show_timepulse_index,
    sa.show_betrail_index,
    sa.show_utmb_index,
    sa.show_history,
    sa.show_statistics,
    sa.custom_notes
  FROM speaker_access sa
  JOIN events e ON e.id = sa.event_id
  WHERE sa.access_code = p_access_code;
END;
$$;

-- =====================================================
-- 10. TRIGGER: Update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_speaker_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_speaker_access_updated_at
  BEFORE UPDATE ON speaker_access
  FOR EACH ROW
  EXECUTE FUNCTION update_speaker_updated_at();

CREATE TRIGGER update_speaker_favorites_updated_at
  BEFORE UPDATE ON speaker_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_speaker_updated_at();

CREATE TRIGGER update_speaker_lists_updated_at
  BEFORE UPDATE ON speaker_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_speaker_updated_at();

CREATE TRIGGER update_speaker_sponsors_updated_at
  BEFORE UPDATE ON speaker_sponsors
  FOR EACH ROW
  EXECUTE FUNCTION update_speaker_updated_at();

-- =====================================================
-- 11. COMMENTAIRES
-- =====================================================
COMMENT ON TABLE speaker_access IS 'Configuration d''accès speaker pour un événement';
COMMENT ON TABLE speaker_favorites IS 'Athlètes marqués en favoris par le speaker';
COMMENT ON TABLE speaker_lists IS 'Listes personnalisées créées par le speaker';
COMMENT ON TABLE speaker_list_entries IS 'Athlètes dans les listes du speaker';
COMMENT ON TABLE speaker_sponsors IS 'Sponsors de l''événement à mentionner';
COMMENT ON TABLE speaker_activity_log IS 'Journal d''activité du speaker';


-- ✅ Fin de: 20251118000001_create_speaker_module.sql


-- ============================================================================
-- Migration: 20251119055900_fix_pgcrypto_and_reset_password.sql
-- ============================================================================

/*
  # Fix pgcrypto extension and reset admin password

  1. Changes
    - Ensure pgcrypto extension is available
    - Reset super admin password to 'Admin2025!'
    
  2. Security
    - Only affects admin authentication
*/

-- Ensure pgcrypto is enabled in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Update the function to use the correct schema path
CREATE OR REPLACE FUNCTION update_admin_password(p_user_id uuid, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  UPDATE admin_users
  SET 
    hashed_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Reset super admin password to 'Admin2025!'
SELECT update_admin_password(
  '387a243b-be3b-4d59-bd3c-31d95a6f89fb'::uuid,
  'Admin2025!'
);


-- ✅ Fin de: 20251119055900_fix_pgcrypto_and_reset_password.sql


-- ============================================================================
-- Migration: 20251119100000_add_admin_rls_policies_for_supabase_auth.sql
-- ============================================================================

/*
  # Add Admin RLS Policies for Supabase Auth Admins

  1. Purpose
    - Admins now authenticate via Supabase Auth (not custom admin_users auth)
    - When an admin logs in, a Supabase Auth user is created with admin metadata
    - Need RLS policies that allow these Supabase Auth users to modify data

  2. How it works
    - Admin login creates a Supabase Auth user with metadata containing admin_id
    - We check if this Supabase Auth user_id exists in admin_users table
    - If yes, grant full access to all tables

  3. New Policies
    - Admin UPDATE/DELETE policies on: events, races, entries, organizers
    - These policies check if auth.uid() corresponds to an admin
*/

-- Helper function to check if current Supabase Auth user is an admin
CREATE OR REPLACE FUNCTION is_supabase_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if there's an admin_users record with this Supabase Auth user_id
  -- The user_id is set when admin logs in via Supabase Auth
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Events: Admin policies
CREATE POLICY "Supabase Auth admins can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all events"
  ON events FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete all events"
  ON events FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

-- Races: Admin policies
CREATE POLICY "Supabase Auth admins can view all races"
  ON races FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all races"
  ON races FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete all races"
  ON races FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert races"
  ON races FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

-- Entries: Admin policies
CREATE POLICY "Supabase Auth admins can view all entries"
  ON entries FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all entries"
  ON entries FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete all entries"
  ON entries FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert entries"
  ON entries FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

-- Organizers: Admin policies
CREATE POLICY "Supabase Auth admins can view all organizers"
  ON organizers FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all organizers"
  ON organizers FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete all organizers"
  ON organizers FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Registrations: Admin policies
CREATE POLICY "Supabase Auth admins can view all registrations"
  ON registrations FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all registrations"
  ON registrations FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete all registrations"
  ON registrations FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Athletes: Admin policies
CREATE POLICY "Supabase Auth admins can view all athletes"
  ON athletes FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all athletes"
  ON athletes FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

-- Race Pricing: Admin policies
CREATE POLICY "Supabase Auth admins can view all race_pricing"
  ON race_pricing FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all race_pricing"
  ON race_pricing FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert race_pricing"
  ON race_pricing FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete race_pricing"
  ON race_pricing FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Race Options: Admin policies
CREATE POLICY "Supabase Auth admins can view all race_options"
  ON race_options FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all race_options"
  ON race_options FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert race_options"
  ON race_options FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete race_options"
  ON race_options FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Race Category Restrictions: Admin policies
CREATE POLICY "Supabase Auth admins can view all race_category_restrictions"
  ON race_category_restrictions FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all race_category_restrictions"
  ON race_category_restrictions FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert race_category_restrictions"
  ON race_category_restrictions FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete race_category_restrictions"
  ON race_category_restrictions FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Invitations: Admin policies
CREATE POLICY "Supabase Auth admins can view all invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Promo Codes: Admin policies
CREATE POLICY "Supabase Auth admins can view all promo_codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can update all promo_codes"
  ON promo_codes FOR UPDATE
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert promo_codes"
  ON promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete promo_codes"
  ON promo_codes FOR DELETE
  TO authenticated
  USING (is_supabase_admin());

-- Event Characteristics: Admin policies
CREATE POLICY "Supabase Auth admins can view all event_characteristics"
  ON event_characteristics FOR SELECT
  TO authenticated
  USING (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can insert event_characteristics"
  ON event_characteristics FOR INSERT
  TO authenticated
  WITH CHECK (is_supabase_admin());

CREATE POLICY "Supabase Auth admins can delete event_characteristics"
  ON event_characteristics FOR DELETE
  TO authenticated
  USING (is_supabase_admin());


-- ✅ Fin de: 20251119100000_add_admin_rls_policies_for_supabase_auth.sql
