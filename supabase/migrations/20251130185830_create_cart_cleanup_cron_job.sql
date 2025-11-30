/*
  # Automatisation du nettoyage des paniers expirés
  
  1. Nouvelles fonctionnalités
    - Active l'extension pg_cron pour les jobs planifiés
    - Crée un job cron qui s'exécute toutes les minutes
    - Le job appelle expire_old_carts() pour nettoyer les paniers expirés
    
  2. Fonctionnement
    - Toutes les minutes, le système vérifie les paniers avec expires_at < now()
    - Les items des paniers expirés sont supprimés
    - Les paniers sont marqués comme 'expired'
    
  3. Notes
    - Le job tourne automatiquement en arrière-plan
    - Aucune action manuelle requise
    - Les paniers expirent 10 minutes après leur dernière activité
*/

-- Activer l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Supprimer le job existant s'il existe (pour éviter les doublons)
SELECT cron.unschedule('cleanup-expired-carts') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-carts'
);

-- Créer un job qui s'exécute toutes les minutes pour nettoyer les paniers expirés
SELECT cron.schedule(
  'cleanup-expired-carts',
  '*/1 * * * *', -- Toutes les minutes
  $$SELECT expire_old_carts();$$
);

-- Vérifier que le job est bien créé
-- Pour voir les jobs : SELECT * FROM cron.job;
-- Pour voir l'historique : SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
