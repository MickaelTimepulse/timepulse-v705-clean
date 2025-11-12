@echo off
cls
echo ========================================
echo   DEPLOIEMENT TIMEPULSE - AUTOMATIQUE
echo ========================================
echo.
echo Ce script va deployer votre site sur Vercel
echo.
pause

echo.
echo Construction du build...
call npm run build

if errorlevel 1 (
    echo.
    echo ❌ Erreur lors du build !
    pause
    exit /b 1
)

echo.
echo ✅ Build termine
echo.
echo Deploiement sur Vercel...
echo.

npx vercel --prod --yes

echo.
echo ========================================
echo   DEPLOIEMENT TERMINE !
echo ========================================
echo.
echo ⚠️  ACTIONS IMPORTANTES:
echo.
echo 1. Allez sur: https://vercel.com/timepulse/project
echo 2. Settings ^> Environment Variables
echo 3. Ajoutez:
echo    - VITE_SUPABASE_URL
echo    - VITE_SUPABASE_ANON_KEY
echo 4. Redeployez: npx vercel --prod --yes
echo.
echo 📄 Consultez DEPLOIEMENT-REUSSI.md pour plus de details
echo.
pause
