/*
  # Add contact and registration fields to events table

  1. Changes
    - Add `contact_email` (text) - Email de contact pour l'événement
    - Add `contact_phone` (text) - Téléphone de contact pour l'événement
    - Add `short_description` (text) - Description courte de l'événement
    - Add `max_participants` (integer) - Limite globale de participants pour l'événement
    - Add `public_registration` (boolean) - Autorisation des inscriptions publiques
    - Add `full_address` (text) - Adresse complète de l'événement

  2. Notes
    - Ces champs permettent une gestion complète des événements
    - `max_participants` NULL signifie pas de limite globale
    - `public_registration` par défaut TRUE pour permettre les inscriptions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE events ADD COLUMN contact_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'contact_phone'
  ) THEN
    ALTER TABLE events ADD COLUMN contact_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'short_description'
  ) THEN
    ALTER TABLE events ADD COLUMN short_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'max_participants'
  ) THEN
    ALTER TABLE events ADD COLUMN max_participants integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'public_registration'
  ) THEN
    ALTER TABLE events ADD COLUMN public_registration boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'full_address'
  ) THEN
    ALTER TABLE events ADD COLUMN full_address text;
  END IF;
END $$;