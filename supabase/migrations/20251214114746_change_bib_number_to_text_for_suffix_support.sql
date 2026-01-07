/*
  # Changer le type de bib_number pour supporter les suffixes

  1. Modifications
    - Change le type de la colonne `bib_number` de `integer` à `text` dans la table `entries`
    - Nécessaire pour supporter les formats avec suffixe comme "001 A", "001 B", etc.
    
  2. Impact
    - Permet les dossards avec suffixe alphabétique pour les équipes
    - Compatible avec les dossards numériques existants
*/

-- Changer le type de bib_number en text
ALTER TABLE entries 
ALTER COLUMN bib_number TYPE text USING bib_number::text;

-- Mettre à jour l'index si nécessaire
DROP INDEX IF EXISTS idx_entries_bib_number;
CREATE INDEX idx_entries_bib_number ON entries(bib_number);
