/*
  # Ajout du règlement sportif aux épreuves

  1. Modifications
    - Ajoute le champ `regulations` (text) à la table `races`
      - Permet aux organisateurs de saisir le règlement sportif de chaque épreuve
      - Contenu au format HTML pour mise en page riche
      - Optionnel (peut être NULL si pas de règlement spécifique)

  2. Notes
    - Le règlement sera affiché aux athlètes avant l'inscription
    - L'acceptation du règlement sera obligatoire pour valider l'inscription
*/

-- Ajouter le champ regulations à la table races
ALTER TABLE races
ADD COLUMN IF NOT EXISTS regulations TEXT;

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN races.regulations IS 'Règlement sportif de l''épreuve au format HTML. Doit être accepté par l''athlète lors de l''inscription.';
