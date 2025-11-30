#!/bin/bash

# Script pour appliquer la migration des caractéristiques d'événements
# Usage: ./apply-characteristics-migration.sh

set -e

echo "🚀 Application de la migration Caractéristiques d'Événements"
echo "============================================================"
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    echo "✓ Fichier .env trouvé"
    source .env
else
    echo "❌ Fichier .env non trouvé !"
    echo "Crée un fichier .env avec tes credentials Supabase"
    exit 1
fi

# Vérifier les variables requises
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Variables manquantes dans .env !"
    echo "Assure-toi d'avoir :"
    echo "  - VITE_SUPABASE_URL"
    echo "  - VITE_SUPABASE_ANON_KEY"
    exit 1
fi

echo "✓ Variables d'environnement chargées"
echo ""

# Fichier de migration
MIGRATION_FILE="supabase/migrations/20251113213448_20251113230000_create_event_characteristics.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Fichier de migration non trouvé : $MIGRATION_FILE"
    echo ""
    echo "Copie d'abord le fichier de migration dans ton projet !"
    exit 1
fi

echo "✓ Fichier de migration trouvé"
echo ""

# Créer un fichier temporaire pour l'exécution
TEMP_SQL=$(mktemp)
cat "$MIGRATION_FILE" > "$TEMP_SQL"

echo "📦 Contenu de la migration :"
echo "----------------------------"
head -20 "$MIGRATION_FILE"
echo "..."
echo ""

echo "⚠️  ATTENTION : Cette migration va :"
echo "  - Créer 2 nouvelles tables"
echo "  - Ajouter 5 policies RLS"
echo "  - Insérer 16 caractéristiques"
echo ""

read -p "Continuer ? (o/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
    echo "❌ Migration annulée"
    rm "$TEMP_SQL"
    exit 1
fi

echo ""
echo "🔄 Application de la migration..."
echo ""

# Option 1 : Utiliser curl pour appliquer via REST API
# Note: Ceci nécessite la clé SERVICE_ROLE, pas la clé ANON

if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Utilisation de la clé SERVICE_ROLE..."

    RESPONSE=$(curl -s -X POST \
        "${VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"sql_query\": $(jq -Rs . < "$TEMP_SQL")}")

    if [ $? -eq 0 ]; then
        echo "✅ Migration appliquée avec succès !"
    else
        echo "❌ Erreur lors de l'application"
        echo "$RESPONSE"
    fi
else
    echo ""
    echo "⚠️  Clé SERVICE_ROLE non trouvée dans .env"
    echo ""
    echo "📋 MÉTHODE MANUELLE :"
    echo "--------------------"
    echo "1. Ouvre Supabase Dashboard : ${VITE_SUPABASE_URL/https:\/\//https://app.supabase.com/project/}/sql"
    echo "2. Crée une nouvelle requête"
    echo "3. Copie-colle le contenu de : $MIGRATION_FILE"
    echo "4. Exécute la requête"
    echo ""
    echo "OU"
    echo ""
    echo "Ajoute SUPABASE_SERVICE_ROLE_KEY dans ton fichier .env"
    echo "(Tu peux la trouver dans Settings > API de ton projet Supabase)"
fi

# Nettoyage
rm "$TEMP_SQL"

echo ""
echo "✨ Prochaines étapes :"
echo "  1. Vérifie les tables dans Supabase Dashboard"
echo "  2. Lance le dev : npm run dev"
echo "  3. Teste les caractéristiques"
echo "  4. Déploie : npm run deploy"
echo ""
