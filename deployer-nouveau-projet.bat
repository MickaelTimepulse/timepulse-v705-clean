@echo off
cls
echo ========================================
echo   DEPLOIEMENT NOUVEAU PROJET VERCEL
echo ========================================
echo.
echo Ce script va:
echo 1. Creer un build propre
echo 2. Deployer sur un NOUVEAU projet Vercel
echo 3. Sans cache corrompu
echo.
pause

echo.
echo Etape 1/2: Build propre...
call npm run build

echo.
echo Etape 2/2: Deploiement sur Vercel...
echo.
echo Si des questions apparaissent:
echo   - Set up and deploy? Y
echo   - Link to existing project? N
echo   - Project name? timepulse-v2-clean
echo   - Directory? Appuyez sur Entree
echo.

call npm run deploy:new

echo.
echo ========================================
echo   DEPLOIEMENT TERMINE !
echo ========================================
echo.
echo PROCHAINES ETAPES IMPORTANTES:
echo.
echo 1. Allez sur: https://vercel.com/dashboard
echo 2. Ouvrez: timepulse-v2-clean
echo 3. Settings ^> Environment Variables
echo 4. Ajoutez:
echo    - VITE_SUPABASE_URL (depuis .env)
echo    - VITE_SUPABASE_ANON_KEY (depuis .env)
echo 5. Redeployez: npm run deploy:new
echo.
echo Votre site: https://timepulse-v2-clean.vercel.app
echo.
pause
