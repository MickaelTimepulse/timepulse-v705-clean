#!/bin/bash

echo "🧹 Suppression de tous les caches locaux..."
rm -rf .vercel .next .turbo out .cache dist node_modules/.cache node_modules/.vite .vite .vite-cache

echo "🔨 Rebuild propre..."
npm run build

echo ""
echo "⚠️  IMPORTANT: Pour vider le cache Vercel, exécutez dans le terminal:"
echo ""
echo "vercel --prod --yes"
echo ""
echo "Si l'erreur persiste, allez sur vercel.com et:"
echo "1. Ouvrez votre projet timepulsev2"
echo "2. Allez dans Settings > General"
echo "3. Cliquez sur 'Clear Build Cache'"
echo "4. Redéployez avec: vercel --prod --yes"
echo ""
