/*
  # Create invitations table
  
  1. New Tables
    - `invitations`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to events)
      - `race_id` (uuid, optional foreign key to races) - Si invitation pour une épreuve spécifique
      - `invited_email` (text) - Email de l'invité
      - `invited_name` (text) - Nom de l'invité
      - `invitation_code` (text, unique) - Code unique de l'invitation
      - `invitation_type` (text) - Type: partner, volunteer, vip, press
      - `status` (text) - Status: sent, used, expired, revoked
      - `valid_until` (timestamptz, optional) - Date d'expiration
      - `used_at` (timestamptz, optional) - Date d'utilisation
      - `used_by_registration_id` (uuid, optional) - Lien vers l'inscription
      - `notes` (text, optional) - Notes de l'organisateur
      - `created_by` (uuid, foreign key to organizers) - Organisateur créateur
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `invitations` table
    - Public can validate invitation codes (read-only, status=sent)
    - Organizers can manage invitations for their events
    - Admins have full access
  
  3. Constraints
    - invitation_code must be unique
    - Cascade delete when event or race is deleted
  
  4. Notes
    - Designed for free entries for partners, VIPs, volunteers
    - Code validation is public to allow registration form usage
    - Status tracking prevents code reuse
*/

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
  used_by_registration_id uuid REFERENCES registrations(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES organizers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Public can validate invitation codes (only sent status)
CREATE POLICY "Anyone can validate invitation codes"
  ON invitations
  FOR SELECT
  USING (
    status = 'sent'
    AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = invitations.event_id
      AND events.status IN ('published', 'open')
    )
  );

-- Organizers can view all invitations for their events
CREATE POLICY "Organizers can view their invitations"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE events.id = invitations.event_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Organizers can manage invitations for their events
CREATE POLICY "Organizers can manage their invitations"
  ON invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE events.id = invitations.event_id
      AND organizers.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      JOIN organizers ON events.organizer_id = organizers.id
      WHERE events.id = invitations.event_id
      AND organizers.user_id::text = auth.uid()::text
    )
  );

-- Admins have full access
CREATE POLICY "Admins can manage all invitations"
  ON invitations
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
CREATE INDEX IF NOT EXISTS idx_invitations_event ON invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_race ON invitations(race_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status) WHERE status = 'sent';