@echo off
REM Script de déploiement rapide - Fix des routes Vercel
REM Ce script push les changements sur GitHub et Vercel

echo ========================================
echo DEPLOIEMENT - FIX DES ROUTES VERCEL
echo ========================================

REM Vérifier si on est dans un dépôt git
if not exist .git (
  echo [ERREUR] Ce n'est pas un depot Git
  echo Initialisez Git avec : git init
  pause
  exit /b 1
)

REM Build local pour vérifier
echo.
echo [1] Build local de verification...
call npm run build
if errorlevel 1 (
  echo [ERREUR] Le build a echoue
  pause
  exit /b 1
)
echo [OK] Build reussi

REM Commit des changements
echo.
echo [2] Commit des changements...
git add vercel.json DEPLOY-FIX-ROUTES.md deploy-fix.sh deploy-fix.bat
git commit -m "fix: configuration Vercel pour routes SPA"
echo [OK] Commit cree

REM Push sur GitHub
echo.
echo [3] Push sur GitHub...
git push origin main
if errorlevel 1 (
  echo [ERREUR] Le push a echoue
  echo Verifiez votre connexion GitHub
  pause
  exit /b 1
)
echo [OK] Push reussi

REM Information sur le déploiement Vercel
echo.
echo ========================================
echo SUCCES !
echo ========================================
echo.
echo Vercel va automatiquement redeployer dans 1-2 minutes.
echo.
echo Suivez le deploiement sur :
echo    https://vercel.com/dashboard
echo.
echo Testez ensuite ces URLs :
echo    - https://timepulsesports.com/races/foulees-du-beluga-2025/results
echo    - https://timepulsesports.com/races/0ce4a635-57d6-4dad-b0f3-dc6fd334b5d6/results
echo.
pause
