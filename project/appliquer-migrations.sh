#!/bin/bash

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║         APPLICATION DES MIGRATIONS SUPABASE - TIMEPULSE               ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 Ce script va :"
echo "   1. Ouvrir le fichier SQL dans votre éditeur"
echo "   2. Ouvrir Supabase SQL Editor dans votre navigateur"
echo ""
echo "📋 Vous devrez ensuite :"
echo "   - Copier tout le contenu du fichier SQL (Cmd+A puis Cmd+C)"
echo "   - Coller dans Supabase SQL Editor (Cmd+V)"
echo "   - Cliquer sur 'Run'"
echo ""
read -p "Appuyez sur Entrée pour continuer..."
echo ""

echo "📂 Ouverture du fichier SQL..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "combined-migrations.sql"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "combined-migrations.sql" 2>/dev/null || gedit "combined-migrations.sql" 2>/dev/null || nano "combined-migrations.sql"
fi

sleep 2

echo ""
echo "🌐 Ouverture de Supabase SQL Editor..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://supabase.com/dashboard/project/fgstscztsighabpzzzix/sql/new"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "https://supabase.com/dashboard/project/fgstscztsighabpzzzix/sql/new"
fi

echo ""
echo "✅ Fichiers ouverts !"
echo ""
echo "📝 ÉTAPES À SUIVRE :"
echo ""
echo "   1️⃣  Dans l'éditeur de texte :"
echo "      - Appuyez sur Cmd+A ou Ctrl+A (tout sélectionner)"
echo "      - Appuyez sur Cmd+C ou Ctrl+C (copier)"
echo ""
echo "   2️⃣  Dans Supabase SQL Editor (navigateur) :"
echo "      - Appuyez sur Cmd+V ou Ctrl+V (coller)"
echo "      - Cliquez sur le bouton 'Run'"
echo "      - Attendez 1-2 minutes"
echo ""
echo "   3️⃣  Une fois terminé :"
echo "      - Lancez votre script de déploiement"
echo "      - Testez votre application !"
echo ""
echo "⚠️  Note : Si vous voyez des erreurs 'already exists', c'est normal !"
echo "    L'important est que l'exécution se termine."
echo ""
echo "💡 Besoin d'aide ? Consultez SOLUTION-SIMPLE.md"
echo ""
