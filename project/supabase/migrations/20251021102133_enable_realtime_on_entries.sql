/*
  # Activer Realtime sur la table entries

  1. Modifications
    - Active la réplication Realtime sur la table `entries`
    - Permet aux abonnements en temps réel de recevoir les changements
  
  2. Sécurité
    - Les politiques RLS existantes s'appliquent également aux abonnements Realtime
*/

ALTER PUBLICATION supabase_realtime ADD TABLE entries;
