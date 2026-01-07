/*
  # Ajout Mode Maintenance

  1. Modifications
    - Ajoute le paramètre `maintenance_mode` dans la table `settings`
    - Ajoute le paramètre `maintenance_message` pour le message personnalisé

  2. Sécurité
    - Seuls les super admins peuvent modifier ces paramètres
*/

-- Insérer les paramètres de maintenance s'ils n'existent pas
INSERT INTO settings (key, value, description)
VALUES
  ('maintenance_mode', 'false', 'Active ou désactive le mode maintenance du site'),
  ('maintenance_message', 'Nous effectuons actuellement une maintenance programmée pour améliorer votre expérience. Le site sera de nouveau disponible très prochainement.', 'Message affiché sur la page de maintenance')
ON CONFLICT (key) DO NOTHING;
