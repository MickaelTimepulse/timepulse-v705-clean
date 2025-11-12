/*
  # Ajout des champs bénévoles à la table events

  1. Modifications
    - Ajout de `volunteer_enabled` (boolean) pour activer/désactiver le module
    - Ajout de `volunteer_registration_open` (boolean) pour ouvrir/fermer les inscriptions
    - Ajout de `volunteer_info_text` (text) pour message d'accueil sur le formulaire public

  2. Notes
    - Par défaut, le module est désactivé (volunteer_enabled = false)
    - Quand activé, les inscriptions sont ouvertes par défaut
    - Le texte d'info est optionnel
*/

-- Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS volunteer_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS volunteer_registration_open boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS volunteer_info_text text;

-- Créer un index pour optimiser les requêtes sur les événements avec bénévoles activés
CREATE INDEX IF NOT EXISTS idx_events_volunteer_enabled
  ON events(volunteer_enabled)
  WHERE volunteer_enabled = true;

-- Commentaires pour documentation
COMMENT ON COLUMN events.volunteer_enabled IS 'Active/désactive le module de gestion des bénévoles pour cet événement';
COMMENT ON COLUMN events.volunteer_registration_open IS 'Permet d''ouvrir ou fermer les inscriptions bénévoles (même si le module est activé)';
COMMENT ON COLUMN events.volunteer_info_text IS 'Texte d''information affiché sur le formulaire public d''inscription bénévole';
