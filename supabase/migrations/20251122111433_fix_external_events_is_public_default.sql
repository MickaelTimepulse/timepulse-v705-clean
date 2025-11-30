/*
  # Fix default is_public pour external_events

  1. Problème
    - La colonne is_public a un default à TRUE
    - La policy RLS exige is_public = FALSE pour les insertions publiques
    - Conflit qui cause l'erreur RLS
    
  2. Solution
    - Change le default de is_public à FALSE
    - Les soumissions publiques auront is_public=false par défaut
*/

-- Changer le default de is_public à false
ALTER TABLE external_events 
  ALTER COLUMN is_public SET DEFAULT false;

-- Mettre à jour la description pour clarifier
COMMENT ON COLUMN external_events.is_public IS 
  'Indique si l''événement est publiquement visible. Default: false. Les admins doivent publier manuellement.';
