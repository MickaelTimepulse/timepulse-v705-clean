/*
  # Ajout des champs FFA étendus pour les athlètes

  1. Nouvelles colonnes
    - `ffa_relcod` (text) - Type de licence FFA (code RELCOD)
    - `ffa_club_code` (text) - Numéro du club maître (STRCODNUM_CLUM)
    - `ffa_league_abbr` (text) - Libellé abrégé ligue (STRNOMABR_LIG)
    - `ffa_department_abbr` (text) - Libellé abrégé département (STRNOMABR_DEP)
  
  2. Détails
    - Ces champs sont récupérés via l'API FFA lors de la vérification de licence
    - Ils permettent un export CSV enrichi avec toutes les données FFA
*/

-- Ajouter les colonnes FFA étendues
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS ffa_relcod text,
ADD COLUMN IF NOT EXISTS ffa_club_code text,
ADD COLUMN IF NOT EXISTS ffa_league_abbr text,
ADD COLUMN IF NOT EXISTS ffa_department_abbr text;

-- Créer des index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_athletes_ffa_club_code ON athletes(ffa_club_code);
CREATE INDEX IF NOT EXISTS idx_athletes_ffa_league_abbr ON athletes(ffa_league_abbr);
CREATE INDEX IF NOT EXISTS idx_athletes_ffa_department_abbr ON athletes(ffa_department_abbr);

-- Commentaires sur les colonnes
COMMENT ON COLUMN athletes.ffa_relcod IS 'Code FFA du type de licence (RELCOD)';
COMMENT ON COLUMN athletes.ffa_club_code IS 'Numéro du club maître FFA (STRCODNUM_CLUM)';
COMMENT ON COLUMN athletes.ffa_league_abbr IS 'Libellé abrégé de la ligue FFA (STRNOMABR_LIG)';
COMMENT ON COLUMN athletes.ffa_department_abbr IS 'Libellé abrégé du département FFA (STRNOMABR_DEP)';
