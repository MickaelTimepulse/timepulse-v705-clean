/*
  # Correction du trigger d'alertes pour la bourse aux dossards

  1. Problème
    - Le trigger précédent utilisait net.http_post qui n'est pas disponible
    - Besoin d'une approche différente

  2. Solution
    - Suppression du trigger automatique
    - Les alertes seront envoyées via l'application frontend
    - Cela permet un meilleur contrôle et gestion des erreurs

  3. Alternative
    - L'application frontend appellera l'edge function après création du listing
    - Plus flexible et plus facile à déboguer
*/

-- Supprimer le trigger et la fonction existants
DROP TRIGGER IF EXISTS trigger_bib_exchange_alert ON bib_exchange_listings;
DROP FUNCTION IF EXISTS notify_bib_exchange_alerts();

-- Note: Les alertes seront désormais envoyées par l'application
-- après la création réussie d'un listing
