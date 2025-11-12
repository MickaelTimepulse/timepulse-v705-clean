/*
  # Ajouter la gestion de la liste publique des inscrits

  1. Modifications
    - Ajouter `show_public_entries_list` (boolean, default true) à la table `races`
    - Ajouter `is_anonymous` (boolean, default false) à la table `athletes`
    - Ajouter `nationality` (text) à la table `athletes`

  2. Notes
    - Par défaut, la liste des inscrits est visible publiquement
    - Les athlètes peuvent choisir de rester anonymes
    - La nationalité sera affichée avec un drapeau
*/

-- Ajouter le champ pour activer/désactiver la liste publique des inscrits
ALTER TABLE races 
ADD COLUMN IF NOT EXISTS show_public_entries_list boolean DEFAULT true;

-- Ajouter le champ pour l'anonymat de l'athlète
ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;

-- Ajouter le champ pour la nationalité de l'athlète
ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS nationality text;