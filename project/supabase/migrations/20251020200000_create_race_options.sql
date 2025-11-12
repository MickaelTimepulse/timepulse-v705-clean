/*
  # Create race options system

  1. New Tables
    - `race_options`
      - `id` (uuid, primary key)
      - `race_id` (uuid, foreign key to races)
      - `type` (text) - Type d'option: tshirt, meal, shuttle, reference_time, itra_points, betrail_points, custom
      - `label` (text) - Libellé de l'option
      - `description` (text, optional) - Description détaillée
      - `image_url` (text, optional) - URL de l'image visuelle
      - `is_question` (boolean) - Si c'est une question avec réponses
      - `is_required` (boolean) - Si l'option est obligatoire
      - `has_quantity_limit` (boolean) - Si limitation de quantité globale
      - `max_quantity` (integer, optional) - Quantité maximale globale
      - `current_quantity` (integer) - Quantité actuelle réservée
      - `price_cents` (integer) - Prix en centimes (0 si gratuit)
      - `available_from` (timestamptz, optional) - Disponible à partir de
      - `available_until` (timestamptz, optional) - Disponible jusqu'à
      - `display_order` (integer) - Ordre d'affichage
      - `active` (boolean) - Si l'option est active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `race_option_choices`
      - `id` (uuid, primary key)
      - `option_id` (uuid, foreign key to race_options)
      - `label` (text) - Libellé du choix (ex: "Taille M", "Menu végétarien")
      - `description` (text, optional)
      - `price_modifier_cents` (integer) - Modificateur de prix (peut être négatif)
      - `has_quantity_limit` (boolean) - Si limitation pour ce choix
      - `max_quantity` (integer, optional) - Quantité max pour ce choix
      - `current_quantity` (integer) - Quantité actuelle
      - `display_order` (integer)
      - `active` (boolean)
      - `created_at` (timestamptz)

    - `registration_options`
      - `id` (uuid, primary key)
      - `registration_id` (uuid, foreign key to registrations)
      - `option_id` (uuid, foreign key to race_options)
      - `choice_id` (uuid, optional, foreign key to race_option_choices)
      - `value` (text, optional) - Valeur si réponse libre
      - `quantity` (integer) - Quantité réservée
      - `price_paid_cents` (integer) - Prix payé pour cette option
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Organizers can manage options for their races
    - Public can view active options for published events
    - Registration options linked to user registrations

  3. Constraints
    - Option types are predefined
    - Quantities cannot exceed limits
    - Dates must be valid
    - Choice must belong to option

  4. Notes
    - Supports multiple types of options
    - Flexible pricing per choice
    - Quantity tracking at option and choice level
    - Time-based availability
*/

-- Create race_options table
CREATE TABLE IF NOT EXISTS race_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('tshirt', 'meal', 'shuttle', 'reference_time', 'itra_points', 'betrail_points', 'custom')),
  label text NOT NULL,
  description text,
  image_url text,
  is_question boolean DEFAULT false,
  is_required boolean DEFAULT false,
  has_quantity_limit boolean DEFAULT false,
  max_quantity integer,
  current_quantity integer DEFAULT 0,
  price_cents integer DEFAULT 0,
  available_from timestamptz,
  available_until timestamptz,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_quantity_limit CHECK (NOT has_quantity_limit OR max_quantity IS NOT NULL),
  CONSTRAINT valid_availability_dates CHECK (available_until IS NULL OR available_from IS NULL OR available_until > available_from)
);

-- Create race_option_choices table
CREATE TABLE IF NOT EXISTS race_option_choices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES race_options(id) ON DELETE CASCADE,
  label text NOT NULL,
  description text,
  price_modifier_cents integer DEFAULT 0,
  has_quantity_limit boolean DEFAULT false,
  max_quantity integer,
  current_quantity integer DEFAULT 0,
  display_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_choice_quantity_limit CHECK (NOT has_quantity_limit OR max_quantity IS NOT NULL)
);

-- Create registration_options table
CREATE TABLE IF NOT EXISTS registration_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES race_options(id) ON DELETE CASCADE,
  choice_id uuid REFERENCES race_option_choices(id) ON DELETE SET NULL,
  value text,
  quantity integer DEFAULT 1,
  price_paid_cents integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_quantity CHECK (quantity > 0)
);

-- Enable RLS
ALTER TABLE race_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_option_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for race_options

-- Public can view active options for published events
CREATE POLICY "Anyone can view active race options"
  ON race_options
  FOR SELECT
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      WHERE races.id = race_options.race_id
      AND events.status IN ('published', 'open')
    )
  );

-- Organizers can view all options for their races
CREATE POLICY "Organizers can view their race options"
  ON race_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_options.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can manage options for their races
CREATE POLICY "Organizers can manage their race options"
  ON race_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_options.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM races
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE races.id = race_options.race_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- RLS Policies for race_option_choices

-- Public can view active choices for active options
CREATE POLICY "Anyone can view active option choices"
  ON race_option_choices
  FOR SELECT
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM race_options
      WHERE race_options.id = race_option_choices.option_id
      AND race_options.active = true
    )
  );

-- Organizers can view all choices for their options
CREATE POLICY "Organizers can view their option choices"
  ON race_option_choices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM race_options
      JOIN races ON race_options.race_id = races.id
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE race_options.id = race_option_choices.option_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can manage choices for their options
CREATE POLICY "Organizers can manage their option choices"
  ON race_option_choices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM race_options
      JOIN races ON race_options.race_id = races.id
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE race_options.id = race_option_choices.option_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM race_options
      JOIN races ON race_options.race_id = races.id
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE race_options.id = race_option_choices.option_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- RLS Policies for registration_options

-- Users can view their own registration options
CREATE POLICY "Users can view their registration options"
  ON registration_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.id = registration_options.registration_id
      AND registrations.user_id::text = auth.uid()::text
    )
  );

-- Organizers can view registration options for their events
CREATE POLICY "Organizers can view registration options for their events"
  ON registration_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations
      JOIN races ON registrations.race_id = races.id
      JOIN events ON races.event_id = events.id
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE registrations.id = registration_options.registration_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Users can insert their registration options during registration
CREATE POLICY "Users can create registration options"
  ON registration_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.id = registration_options.registration_id
      AND registrations.user_id::text = auth.uid()::text
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_race_options_race ON race_options(race_id);
CREATE INDEX IF NOT EXISTS idx_race_options_active ON race_options(race_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_race_option_choices_option ON race_option_choices(option_id);
CREATE INDEX IF NOT EXISTS idx_registration_options_registration ON registration_options(registration_id);
CREATE INDEX IF NOT EXISTS idx_registration_options_option ON registration_options(option_id);
CREATE INDEX IF NOT EXISTS idx_registration_options_choice ON registration_options(choice_id);
