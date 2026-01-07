/*
  # Ajout du consentement d'affichage public des résultats

  1. Modifications
    - Ajoute le champ `public_results_consent` à la table `athletes`
    - Par défaut à `true` car pour les licenciés FFA c'est généralement accepté

  2. Détails
    - Ce champ permet de respecter le RGPD et la CNIL
    - L'athlète peut refuser que son nom apparaisse sur les classements publics
    - Utilisé dans les exports FFA (champ E_CNIL_WEB)
*/

-- Ajouter la colonne de consentement d'affichage public
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS public_results_consent boolean DEFAULT true;

-- Créer un index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_athletes_public_consent ON athletes(public_results_consent);

-- Commentaire sur la colonne
COMMENT ON COLUMN athletes.public_results_consent IS 'Consentement de l''athlète pour l''affichage public de son nom dans les résultats (CNIL/RGPD)';
