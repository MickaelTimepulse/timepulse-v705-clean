@echo off
cls
echo ========================================
echo   DEPLOIEMENT TIMEPULSE V2 - PROPRE
echo ========================================
echo.

echo Verification de Vercel CLI...
call npx vercel --version >nul 2>&1
if errorlevel 1 (
    echo Installation de Vercel CLI...
    call npm install -g vercel
)

echo.
echo Etape 1: Verification du build...
if not exist "dist\index.html" (
    echo Build manquant, creation en cours...
    call npm run build
)

echo.
echo ========================================
echo   DEPLOIEMENT EN COURS...
echo ========================================
echo.
echo IMPORTANT: Si on vous demande:
echo   - Set up and deploy? Tapez Y
echo   - Link to existing project? Tapez N
echo   - Project name? Tapez: timepulse-v2-clean
echo   - Directory? Appuyez sur Entree
echo.
pause

npx vercel --name timepulse-v2-clean --prod --yes

echo.
echo ========================================
echo   DEPLOIEMENT TERMINE !
echo ========================================
echo.
echo Prochaines etapes:
echo.
echo 1. Allez sur https://vercel.com/dashboard
echo 2. Ouvrez le projet "timepulse-v2-clean"
echo 3. Allez dans Settings ^> Environment Variables
echo 4. Ajoutez ces variables (copiez depuis .env):
echo    - VITE_SUPABASE_URL
echo    - VITE_SUPABASE_ANON_KEY
echo 5. Redeployez avec: npx vercel --prod --yes
echo.
echo Votre site sera accessible sur:
echo https://timepulse-v2-clean.vercel.app
echo.
pause
