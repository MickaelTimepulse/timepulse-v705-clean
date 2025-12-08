#!/bin/bash
echo "========================================"
echo "FIX 404 - DEPLOIEMENT VERCEL"
echo "========================================"
echo ""

echo "[1/4] Build du projet..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERREUR: Le build a échoué"
    exit 1
fi

echo ""
echo "[2/4] Suppression du cache Vercel..."
rm -rf .vercel

echo ""
echo "[3/4] Déploiement en production avec cache vide..."
vercel --prod --yes --force

echo ""
echo "[4/4] Terminé !"
echo ""
echo "Votre site est déployé avec la correction 404"
echo "Attendez 2-3 minutes pour la propagation complète"
echo ""
