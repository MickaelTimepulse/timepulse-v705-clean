#!/bin/bash

echo "============================================"
echo "  PUSH AUTOMATIQUE VERS GITHUB"
echo "  Repository: timepulse-v705-clean"
echo "============================================"
echo ""

echo "[1/4] Ajout des fichiers modifiés..."
git add .

echo ""
echo "[2/4] Création du commit..."
read -p "Message du commit (ou appuyez sur Entrée pour message auto): " message
if [ -z "$message" ]; then
    message="Mise à jour automatique du $(date '+%Y-%m-%d %H:%M:%S')"
fi
git commit -m "$message"

echo ""
echo "[3/4] Configuration du remote GitHub..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/MickaelTimepulse/timepulse-v705-clean.git

echo ""
echo "[4/4] Push vers GitHub (timepulse-v705-clean)..."
git push -u origin main

echo ""
echo "============================================"
echo "  TERMINÉ !"
echo "============================================"
