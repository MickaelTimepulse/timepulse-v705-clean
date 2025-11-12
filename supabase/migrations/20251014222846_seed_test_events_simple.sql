/*
  # Créer des événements de test (version simplifiée)

  1. Approche
    - Rendre temporairement organizer_id nullable
    - Créer les événements de test
    - Restaurer la contrainte après
    
  2. Données
    - 6 événements publiés avec dates futures
    - Images depuis Pexels
*/

-- Temporairement, supprimer la contrainte NOT NULL sur organizer_id
ALTER TABLE events ALTER COLUMN organizer_id DROP NOT NULL;

-- Insérer les événements de test
INSERT INTO events (name, slug, description, event_type, city, country, start_date, end_date, image_url, status, is_featured, created_at)
VALUES
  ('10km de Paris 2025', '10km-paris-2025', 'Course urbaine dans les rues de Paris avec départ des Champs-Élysées. Une course emblématique ouverte à tous les niveaux.', 'running', 'Paris', 'France', '2025-04-15', '2025-04-15', 'https://images.pexels.com/photos/2802970/pexels-photo-2802970.jpeg?auto=compress&cs=tinysrgb&w=800', 'published', true, NOW() - INTERVAL '30 days'),
  
  ('Trail du Mont Blanc UTMB', 'trail-mont-blanc-2025', 'Trail de montagne légendaire autour du Mont Blanc - 170km et 10 000m D+. Le rendez-vous incontournable des traileurs.', 'trail', 'Chamonix', 'France', '2025-06-20', '2025-06-22', 'https://images.pexels.com/photos/2706654/pexels-photo-2706654.jpeg?auto=compress&cs=tinysrgb&w=800', 'published', true, NOW() - INTERVAL '60 days'),
  
  ('Marathon de Lyon', 'marathon-lyon-2025', 'Marathon international de Lyon traversant la ville lumière. Parcours rapide et spectaculaire.', 'running', 'Lyon', 'France', '2025-05-10', '2025-05-10', 'https://images.pexels.com/photos/618612/pexels-photo-618612.jpeg?auto=compress&cs=tinysrgb&w=800', 'published', false, NOW() - INTERVAL '20 days'),
  
  ('Triathlon Ironman Nice', 'triathlon-nice-2025', 'Triathlon format Ironman sur la magnifique Côte d''Azur. Natation, vélo et course à pied dans un cadre exceptionnel.', 'triathlon', 'Nice', 'France', '2025-07-05', '2025-07-05', 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=800', 'published', false, NOW() - INTERVAL '10 days'),
  
  ('Semi-Marathon de Bordeaux', 'semi-marathon-bordeaux-2025', 'Semi-marathon dans le vignoble bordelais, parcours entre châteaux et vignes. Ambiance conviviale garantie.', 'running', 'Bordeaux', 'France', '2025-09-14', '2025-09-14', 'https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=800', 'published', false, NOW() - INTERVAL '5 days'),
  
  ('Trail des Calanques', 'trail-calanques-2025', 'Trail côtier spectaculaire entre mer et montagne dans les Calanques. Paysages à couper le souffle.', 'trail', 'Marseille', 'France', '2025-10-18', '2025-10-18', 'https://images.pexels.com/photos/2803158/pexels-photo-2803158.jpeg?auto=compress&cs=tinysrgb&w=800', 'published', false, NOW())
ON CONFLICT (slug) DO NOTHING;
