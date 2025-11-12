#!/bin/bash

# Script de déploiement automatique des Edge Functions Supabase
# Usage: ./deploy-edge-functions.sh [function_name]

set -e

PROJECT_REF="fgstscztsighabpzzzix"
SUPABASE_URL="https://fgstscztsighabpzzzix.supabase.co"

echo "🚀 Déploiement des Edge Functions sur Supabase"
echo "================================================"

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    exit 1
fi

echo "✅ Supabase CLI version: $(supabase --version)"

# Vérifier si un nom de fonction est fourni
if [ -z "$1" ]; then
    echo "📋 Déploiement de toutes les Edge Functions..."
    FUNCTIONS_DIR="supabase/functions"

    # Parcourir tous les dossiers de fonctions
    for func_dir in "$FUNCTIONS_DIR"/*; do
        if [ -d "$func_dir" ] && [ -f "$func_dir/index.ts" ]; then
            func_name=$(basename "$func_dir")

            # Ignorer le dossier _shared
            if [ "$func_name" = "_shared" ]; then
                continue
            fi

            echo ""
            echo "📦 Déploiement de: $func_name"

            # Déployer la fonction via API Management
            supabase functions deploy "$func_name" --project-ref "$PROJECT_REF" --no-verify-jwt || {
                echo "⚠️  Échec du déploiement de $func_name (continuant...)"
            }
        fi
    done
else
    func_name="$1"
    echo "📦 Déploiement de la fonction: $func_name"

    if [ ! -d "supabase/functions/$func_name" ]; then
        echo "❌ La fonction $func_name n'existe pas dans supabase/functions/"
        exit 1
    fi

    supabase functions deploy "$func_name" --project-ref "$PROJECT_REF" --no-verify-jwt
fi

echo ""
echo "✅ Déploiement terminé !"
echo "🔗 Vérifiez vos fonctions sur: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
