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