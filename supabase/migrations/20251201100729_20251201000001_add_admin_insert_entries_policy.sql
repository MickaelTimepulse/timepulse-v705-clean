/*
  # Ajouter politique INSERT pour les admins sur entries

  1. Politique RLS
    - Permettre aux admins (super_admin et timepulse_staff) d'insérer des inscriptions
    - Nécessaire pour l'import CSV Timepulse

  2. Sécurité
    - La fonction is_admin() vérifie déjà les rôles autorisés
    - Les admins peuvent importer des inscriptions pour n'importe quel événement
*/

-- Ajouter la politique INSERT pour les admins
CREATE POLICY "Admins can insert entries"
  ON entries FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Commentaire
COMMENT ON POLICY "Admins can insert entries" ON entries IS
  'Permet aux super_admin et timepulse_staff d''insérer des inscriptions via import CSV';
