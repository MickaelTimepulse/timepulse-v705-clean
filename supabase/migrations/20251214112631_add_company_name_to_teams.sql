/*
  # Ajout du champ company_name aux équipes

  1. Modifications
    - Ajoute la colonne `company_name` à la table `teams`
    - Cette colonne permet de stocker le nom de l'entreprise ou association pour les équipes
    - Utilisée comme fallback si aucun club n'est représenté dans l'équipe
*/

ALTER TABLE teams ADD COLUMN IF NOT EXISTS company_name text;
