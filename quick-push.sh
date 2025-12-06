#!/bin/bash
# Script de push rapide - Commit et push en une commande
# Usage: ./quick-push.sh "votre message de commit"

if [ -z "$1" ]; then
    message="Update $(date '+%Y-%m-%d %H:%M:%S')"
else
    message="$1"
fi

echo "Commit et push: $message"
git add . && git commit -m "$message" && git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Push réussi vers GitHub !"
else
    echo ""
    echo "✗ Erreur lors du push"
fi
