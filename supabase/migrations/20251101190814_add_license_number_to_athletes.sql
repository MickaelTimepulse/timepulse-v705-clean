/*
  # Ajout de la colonne license_number à la table athletes
  
  1. Modifications
    - Ajoute la colonne `license_number` pour stocker le numéro de licence
*/

-- Ajouter la colonne license_number
ALTER TABLE athletes 
ADD COLUMN IF NOT EXISTS license_number varchar(50);

-- Index pour rechercher par numéro de licence
CREATE INDEX IF NOT EXISTS idx_athletes_license_number 
ON athletes(license_number) 
WHERE license_number IS NOT NULL;

-- Commentaire
COMMENT ON COLUMN athletes.license_number IS 'Numéro de licence (FFA, FFTri, etc.)';
