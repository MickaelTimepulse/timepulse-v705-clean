#!/bin/bash

# 🧪 Script de Setup Test Local - Timepulse
# Ce script automatise la configuration de l'environnement de test local

set -e  # Arrêter si erreur

echo "🚀 Setup Test Local Timepulse"
echo "================================"
echo ""

# Couleurs pour output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher succès
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Fonction pour afficher warning
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Fonction pour afficher erreur
error() {
    echo -e "${RED}✗ $1${NC}"
}

# 1. Vérifier Node.js
echo "📦 Vérification Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    success "Node.js installé: $NODE_VERSION"

    # Vérifier version >= 18
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        error "Node.js version 18+ requise. Vous avez $NODE_VERSION"
        exit 1
    fi
else
    error "Node.js non installé. Installer depuis https://nodejs.org"
    exit 1
fi
echo ""

# 2. Installer dépendances
echo "📚 Installation des dépendances..."
if [ -f "package.json" ]; then
    npm install
    success "Dépendances installées"
else
    error "package.json non trouvé. Êtes-vous dans le bon dossier?"
    exit 1
fi
echo ""

# 3. Configurer .env
echo "⚙️  Configuration .env..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        success ".env créé depuis .env.example"
        warning "IMPORTANT: Éditer .env avec vos clés Supabase!"
        echo ""
        echo "Ouvrir .env et ajouter:"
        echo "  VITE_SUPABASE_URL=https://votre-projet.supabase.co"
        echo "  VITE_SUPABASE_ANON_KEY=votre_cle_anon"
        echo ""
        read -p "Appuyer sur Entrée après avoir configuré .env..."
    else
        error ".env.example non trouvé"
        exit 1
    fi
else
    success ".env existe déjà"
fi
echo ""

# 4. Vérifier configuration Supabase
echo "🔍 Vérification configuration Supabase..."
if grep -q "VITE_SUPABASE_URL=https://" .env && grep -q "VITE_SUPABASE_ANON_KEY=eyJ" .env; then
    success "Configuration Supabase semble OK"
else
    error "Configuration Supabase incomplète dans .env"
    echo "Vérifier que vous avez bien:"
    echo "  - VITE_SUPABASE_URL (commence par https://)"
    echo "  - VITE_SUPABASE_ANON_KEY (commence par eyJ)"
    exit 1
fi
echo ""

# 5. Vérifier TypeScript
echo "🔧 Vérification TypeScript..."
npm run typecheck
if [ $? -eq 0 ]; then
    success "TypeScript OK (0 errors)"
else
    error "Erreurs TypeScript détectées"
    exit 1
fi
echo ""

# 6. Build production test
echo "🏗️  Test build production..."
npm run build
if [ $? -eq 0 ]; then
    success "Build réussi"

    # Afficher taille
    BUILD_SIZE=$(du -sh dist | cut -f1)
    echo "   Taille: $BUILD_SIZE"
else
    error "Build échoué"
    exit 1
fi
echo ""

# 7. Créer données de test
echo "📊 Voulez-vous créer des données de test? (y/n)"
read -p "> " CREATE_TEST_DATA

if [ "$CREATE_TEST_DATA" = "y" ] || [ "$CREATE_TEST_DATA" = "Y" ]; then
    echo "Création de test-data.sql..."
    cat > test-data.sql << 'EOF'
-- 🧪 Données de Test Timepulse

-- 1. Créer un organisateur test
INSERT INTO organizers (id, name, email, phone, address, city, postal_code, country)
VALUES (
  gen_random_uuid(),
  'Chrono Test',
  'test@chronotest.fr',
  '0612345678',
  '123 Rue du Sport',
  'Paris',
  '75001',
  'France'
)
ON CONFLICT DO NOTHING
RETURNING id;

-- Note: Copier l'ID retourné et le mettre dans les requêtes suivantes

-- 2. Créer un événement test
-- Remplacer 'ORGANIZER_ID_ICI' par l'ID copié ci-dessus
INSERT INTO events (
  id,
  name,
  description,
  location,
  start_date,
  end_date,
  organizer_id,
  status,
  sport_type,
  max_participants
)
VALUES (
  gen_random_uuid(),
  'Marathon Test Paris 2025',
  'Événement de test pour validation plateforme Timepulse',
  'Paris, France',
  '2025-06-15',
  '2025-06-15',
  'ORGANIZER_ID_ICI',
  'published',
  'running',
  1000
)
ON CONFLICT DO NOTHING
RETURNING id;

-- 3. Créer des courses
-- Remplacer 'EVENT_ID_ICI' par l'ID de l'événement créé
INSERT INTO races (event_id, name, distance, elevation_gain, max_participants, start_time, price)
VALUES
  ('EVENT_ID_ICI', '10km', 10, 100, 300, '2025-06-15 09:00:00', 25.00),
  ('EVENT_ID_ICI', '21km', 21.1, 250, 500, '2025-06-15 09:30:00', 35.00),
  ('EVENT_ID_ICI', '42km', 42.2, 450, 200, '2025-06-15 10:00:00', 45.00)
ON CONFLICT DO NOTHING;

-- 4. Afficher les IDs créés
SELECT 'Organisateurs créés:' as info;
SELECT id, name, email FROM organizers WHERE email = 'test@chronotest.fr';

SELECT 'Événements créés:' as info;
SELECT id, name, location, start_date FROM events WHERE name LIKE '%Test%';

SELECT 'Courses créées:' as info;
SELECT id, name, distance, price FROM races WHERE event_id IN (
  SELECT id FROM events WHERE name LIKE '%Test%'
);
EOF

    success "Fichier test-data.sql créé"
    echo ""
    echo "Pour créer les données de test:"
    echo "1. Aller sur https://supabase.com/dashboard"
    echo "2. SQL Editor > New Query"
    echo "3. Copier/coller le contenu de test-data.sql"
    echo "4. Exécuter"
    echo ""
fi

# 8. Créer fichier CSV de test résultats
echo "📋 Création fichier test-results.csv..."
cat > test-results.csv << 'EOF'
Dossard,Nom,Prénom,Sexe,Catégorie,Temps
1,MARTIN,Jean,M,SEM,01:25:30
2,DUBOIS,Sophie,F,SEF,01:28:15
3,DURAND,Pierre,M,V1M,01:32:45
4,BERNARD,Marie,F,V1F,01:35:20
5,THOMAS,Paul,M,SEM,01:38:50
6,PETIT,Claire,F,SEF,01:42:10
7,ROBERT,Michel,M,V2M,01:45:30
8,RICHARD,Anne,F,V1F,01:48:15
9,SIMON,Luc,M,SEM,01:52:00
10,LAURENT,Julie,F,SEF,01:55:45
EOF
success "test-results.csv créé (10 résultats)"
echo ""

# 9. Résumé
echo "================================"
echo "✅ Setup Terminé!"
echo "================================"
echo ""
echo "Prochaines étapes:"
echo ""
echo "1. 🗄️  Appliquer les migrations Supabase:"
echo "   - Aller sur https://supabase.com/dashboard"
echo "   - SQL Editor"
echo "   - Copier/coller chaque fichier de supabase/migrations/"
echo "   - Exécuter dans l'ordre chronologique"
echo ""
echo "2. 🚀 Lancer le serveur dev:"
echo "   npm run dev"
echo ""
echo "3. 🌐 Ouvrir dans le navigateur:"
echo "   http://localhost:5173"
echo ""
echo "4. 🧪 Suivre TEST-LOCAL-GUIDE.md pour tests complets"
echo ""
echo "Fichiers de test créés:"
echo "  - test-data.sql (données test DB)"
echo "  - test-results.csv (résultats test import)"
echo ""
echo "📚 Documentation complète:"
echo "  - TEST-LOCAL-GUIDE.md"
echo "  - LOCAL-DEVELOPMENT.md"
echo "  - FEATURES-COMPLETE.md"
echo ""
success "Bon test! 🎉"
