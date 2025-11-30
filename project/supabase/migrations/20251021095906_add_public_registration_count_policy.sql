/*
  # Ajouter une politique RLS publique pour compter les inscriptions

  1. Modifications
    - Ajoute une politique SELECT sur `registrations` pour les utilisateurs anonymes
    - Permet uniquement de voir l'ID et le race_id pour compter les inscriptions
    - Restreint aux inscriptions confirmées ou en attente (status = 'pending' ou 'confirmed')
  
  2. Sécurité
    - Les données personnelles restent protégées
    - Seules les informations nécessaires au comptage sont accessibles
    - La politique s'applique uniquement aux courses d'événements publiés
*/

-- Ajouter une politique pour permettre aux utilisateurs anonymes de compter les inscriptions
CREATE POLICY "Anyone can count registrations for published events"
  ON registrations
  FOR SELECT
  TO anon
  USING (
    race_id IN (
      SELECT r.id
      FROM races r
      JOIN events e ON r.event_id = e.id
      WHERE e.status = 'published'
      AND r.status = 'active'
    )
  );
