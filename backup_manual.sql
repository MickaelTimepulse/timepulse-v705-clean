-- ========================================
-- BACKUP SUPABASE - $(date +%Y-%m-%d_%H-%M-%S)
-- ========================================

-- Timestamp de la sauvegarde
SELECT 'Backup créé le: ' || NOW()::text as backup_info;

-- Statistiques de la base
SELECT 'Nombre de tables: ' || COUNT(*)::text FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Nombre d événements: ' || COUNT(*)::text FROM events;
SELECT 'Nombre d inscriptions: ' || COUNT(*)::text FROM entries;
SELECT 'Nombre d organisateurs: ' || COUNT(*)::text FROM organizers;
SELECT 'Nombre de résultats: ' || COUNT(*)::text FROM results;
SELECT 'Nombre d athlètes: ' || COUNT(*)::text FROM athletes;
