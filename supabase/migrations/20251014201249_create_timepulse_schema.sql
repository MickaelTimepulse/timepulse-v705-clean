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