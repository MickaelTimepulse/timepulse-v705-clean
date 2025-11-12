/*
  # Activer Realtime sur la table registrations

  1. Modifications
    - Active la réplication Realtime sur la table `registrations`
    - Permet aux abonnements en temps réel de recevoir les changements
  
  2. Sécurité
    - Les politiques RLS existantes s'appliquent également aux abonnements Realtime
*/

-- Activer la réplication Realtime sur la table registrations
ALTER PUBLICATION supabase_realtime ADD TABLE registrations;
