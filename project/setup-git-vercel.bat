@echo off
echo ========================================
echo  CONFIGURATION INITIALE GIT + VERCEL
echo ========================================
echo.

echo [1/5] Initialisation Git...
git init
git branch -M main

echo.
echo [2/5] Configuration Git...
git config user.name "Timepulse"
git config user.email "contact@timepulse.fr"

echo.
echo [3/5] Premier commit...
git add .
git commit -m "Initial commit - Timepulse Registration Platform"

echo.
echo [4/5] Connexion a GitHub...
echo.
echo IMPORTANT: Creer un repo GitHub vide nomme 'timepulse-registration'
echo puis copier l'URL SSH ou HTTPS
echo.
set /p GITHUB_URL="Entrez l'URL du repo GitHub: "

if not "%GITHUB_URL%"=="" (
    git remote add origin %GITHUB_URL%
    git push -u origin main
    echo GitHub connecte avec succes !
) else (
    echo GitHub skip - vous pourrez le faire plus tard
)

echo.
echo [5/5] Configuration Vercel...
npx vercel link --yes

echo.
echo ========================================
echo  CONFIGURATION TERMINEE !
echo ========================================
echo.
echo Utilisez maintenant:
echo   deploy-auto.bat  - Deploiement complet
echo   deploy-quick.bat - Deploiement rapide
echo.
pause
