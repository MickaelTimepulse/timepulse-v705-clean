#!/bin/bash

# Script de deploiement - Fix des URLs avec ref_id

echo "========================================"
echo "DEPLOIEMENT - FIX DES URLs REF_ID"
echo "========================================"

# Verifier si on est dans un depot git
if [ ! -d .git ]; then
  echo "❌ Erreur : Ce n'est pas un depot Git"
  exit 1
fi

# Build local
echo ""
echo "📦 [1] Build local..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Le build a echoue"
  exit 1
fi
echo "✅ Build reussi"

# Commit
echo ""
echo "📝 [2] Commit des changements..."
git add src/pages/RaceResults.tsx vercel.json CHECK-REF-IDS.md DEPLOY-REF-IDS.bat DEPLOY-REF-IDS.sh
git commit -m "feat: support des ref_id format R123456 pour les URLs de resultats"
echo "✅ Commit cree"

# Push
echo ""
echo "⬆️  [3] Push sur GitHub..."
git push origin main
if [ $? -ne 0 ]; then
  echo "❌ Le push a echoue"
  exit 1
fi
echo "✅ Push reussi"

echo ""
echo "========================================"
echo "SUCCES - PROCHAINES ETAPES"
echo "========================================"
echo ""
echo "1. Vercel va redeployer automatiquement (1-2 minutes)"
echo ""
echo "2. IMPORTANT: Appliquez la migration des ref_id dans Supabase :"
echo "   - Allez sur https://supabase.com/dashboard"
echo "   - Menu 'SQL Editor'"
echo "   - Copiez le contenu de :"
echo "     supabase/migrations/20251206234957_add_reference_ids.sql"
echo "   - Cliquez 'Run'"
echo ""
echo "3. Verifiez qu'elle a bien ete appliquee :"
echo "   SELECT name, ref_id FROM races LIMIT 10;"
echo ""
echo "4. Recuperez le ref_id de votre course :"
echo "   SELECT name, ref_id, id FROM races"
echo "   WHERE id = '0ce4a635-57d6-4dad-b0f3-dc6fd334b5d6';"
echo ""
echo "5. Testez avec la nouvelle URL :"
echo "   https://timepulsesports.com/races/R123456/results"
echo ""
echo "Voir CHECK-REF-IDS.md pour plus de details."
echo ""
