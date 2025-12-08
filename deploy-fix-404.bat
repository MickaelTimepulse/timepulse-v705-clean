@echo off
echo ========================================
echo FIX 404 - DEPLOIEMENT VERCEL
echo ========================================
echo.

echo [1/4] Build du projet...
call npm run build
if errorlevel 1 (
    echo ERREUR: Le build a echoue
    pause
    exit /b 1
)

echo.
echo [2/4] Suppression du cache Vercel...
rmdir /s /q .vercel 2>nul

echo.
echo [3/4] Deploiement en production avec cache vide...
call vercel --prod --yes --force

echo.
echo [4/4] Termine !
echo.
echo Votre site est deploye avec la correction 404
echo Attendez 2-3 minutes pour la propagation complete
echo.
pause
