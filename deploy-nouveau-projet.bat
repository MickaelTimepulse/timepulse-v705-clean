@echo off
echo Creation d'un nouveau projet Vercel PROPRE
echo.

echo Nettoyage complet...
rmdir /s /q .vercel .next .turbo out .cache dist node_modules\.cache node_modules\.vite .vite .vite-cache 2>nul

echo Build propre...
call npm run build

echo.
echo Maintenant, nous allons creer un NOUVEAU projet Vercel
echo.
echo Executez cette commande pour creer un nouveau projet:
echo.
echo   vercel --name timepulse-v2-clean --prod --yes
echo.
echo Cela va:
echo   1. Creer un nouveau projet sans cache corrompu
echo   2. Demander vos infos de deploiement
echo   3. Deployer immediatement
echo.
echo IMPORTANT: Apres le deploiement, copiez les variables d'environnement
echo depuis l'ancien projet sur vercel.com
echo.
pause
