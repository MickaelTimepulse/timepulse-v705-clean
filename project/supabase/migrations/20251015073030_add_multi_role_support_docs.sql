/*
  # Documentation: Support Multi-Rôle (Athlète + Organisateur)
  
  ## Contexte
  Un utilisateur peut avoir plusieurs rôles simultanément dans Timepulse:
  - **Athlète**: Inscription aux événements, suivi des performances
  - **Organisateur**: Création et gestion d'événements
  - **Admin**: Administration de la plateforme (rôle exclusif)
  
  ## Architecture Multi-Rôle
  
  ### Structure des Données
  ```
  auth.users (Supabase Auth)
    └── profiles (1:1) - Profil utilisateur de base
        ├── organizers (0:1) - Données organisateur si l'utilisateur est organisateur
        └── athletes (0:1) - Données athlète si l'utilisateur est athlète (future table)
  ```
  
  ### Règles Métier
  
  1. **Email Non-Unique par Rôle**
     - Un même email peut exister dans `organizers` ET `athletes`
     - L'email est UNIQUE dans `auth.users` et `profiles`
     - Les tables de rôle (organizers, athletes) n'ont PAS de contrainte UNIQUE sur email
  
  2. **ID Organisateur Unique**
     - Chaque organisateur a un `id` unique (UUID)
     - Le `user_id` référence le profil mais n'est pas l'ID de l'organisateur
     - Permet de distinguer les organisateurs même avec le même utilisateur de base
  
  3. **Création d'Organisateur**
     - Si l'email existe déjà → Utiliser le compte existant
     - Si l'email n'existe pas → Créer un nouveau compte auth + profil
     - Toujours créer une nouvelle entrée `organizers` (ID unique)
  
  4. **Vérification des Doublons**
     - Avant création: vérifier si `user_id` existe déjà dans `organizers`
     - Un utilisateur ne peut avoir qu'UN SEUL profil organisateur
     - Mais peut gérer plusieurs organisations via ce profil
  
  ## Exemples d'Usage
  
  ### Scénario 1: Athlète devient Organisateur
  ```
  1. Jean existe comme athlète (jean@email.fr)
  2. Admin crée un compte organisateur pour jean@email.fr
  3. Système détecte le compte existant
  4. Création d'une entrée organizers liée au profile de Jean
  5. Jean peut maintenant:
     - S'inscrire aux courses (rôle athlète)
     - Créer des événements (rôle organisateur)
  ```
  
  ### Scénario 2: Nouveau Organisateur
  ```
  1. Admin crée un compte organisateur pour club@email.fr
  2. Email n'existe pas dans le système
  3. Création de:
     - Compte auth.users
     - Profil dans profiles
     - Entrée dans organizers
  4. Mot de passe temporaire généré et communiqué
  ```
  
  ## Sécurité RLS
  
  - Les policies RLS vérifient `user_id` pour l'accès
  - Un utilisateur voit UNIQUEMENT ses données d'organisateur
  - Les données athlète et organisateur sont séparées
  - Les admins ont accès à toutes les données
  
  ## Tables Impactées
  
  - `profiles`: Email unique, un profil par compte auth
  - `organizers`: Email non-unique, user_id référence profiles
  - `athletes` (future): Email non-unique, user_id référence profiles
  - `admin_users`: Email unique, rôle exclusif (pas de multi-rôle)
  
  ## Notes Importantes
  
  - Un utilisateur peut avoir 0, 1 ou plusieurs rôles (sauf admin qui est exclusif)
  - L'authentification se fait toujours via le compte principal (auth.users)
  - Le routage post-connexion détermine le contexte (athlete vs organizer)
  - Les données restent séparées et privées entre les rôles
*/

-- This migration is documentation only, no schema changes needed

-- Add comment to organizers table
COMMENT ON TABLE organizers IS 'Organisateurs d''événements. Un utilisateur (profiles.id) peut être organisateur ET athlète. L''email n''est pas unique car le même email peut exister en tant qu''athlète.';

-- Add comment to organizers.user_id
COMMENT ON COLUMN organizers.user_id IS 'Référence au profil utilisateur. Un utilisateur peut avoir plusieurs organisations mais un seul profil organisateur.';

-- Add comment to organizers.email
COMMENT ON COLUMN organizers.email IS 'Email de contact de l''organisateur. Peut être identique à l''email athlète du même utilisateur.';

-- Add comment to organizers.id
COMMENT ON COLUMN organizers.id IS 'ID unique de l''organisateur. Différent du user_id pour permettre la gestion multi-organisation future.';