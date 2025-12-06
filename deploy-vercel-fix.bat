@echo off
REM ============================================================================
REM Script de déploiement Vercel avec fix 404 (Windows)
REM ============================================================================

setlocal EnableDelayedExpansion

echo ============================================
echo   Deploiement TimePulse v705 vers Vercel
echo ============================================
echo.

REM Vérifier que nous sommes dans le bon dossier
if not exist package.json (
    echo [ERREUR] package.json non trouve
    echo Assurez-vous d'etre dans le dossier racine du projet
    pause
    exit /b 1
)

REM Vérifier que Vercel CLI est installé
where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ATTENTION] Vercel CLI n'est pas installe
    echo Installation de Vercel CLI...
    call npm install -g vercel
)

REM Étape 1 : Nettoyage
echo.
echo [1/5] Nettoyage...
if exist dist rmdir /s /q dist
if exist .vercel rmdir /s /q .vercel
if exist node_modules\.vite rmdir /s /q node_modules\.vite
echo [OK] Nettoyage termine

REM Étape 2 : Installation des dépendances
echo.
echo [2/5] Installation des dependances...
call npm ci --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Installation des dependances echouee
    pause
    exit /b 1
)
echo [OK] Dependances installees

REM Étape 3 : Build
echo.
echo [3/5] Build du projet...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Le build a echoue
    pause
    exit /b 1
)

if not exist dist (
    echo [ERREUR] Le dossier dist n'a pas ete cree
    pause
    exit /b 1
)
echo [OK] Build reussi

REM Étape 4 : Vérifier les fichiers critiques
echo.
echo [4/5] Verification des fichiers...

if not exist vercel.json (
    echo [ERREUR] vercel.json manquant
    pause
    exit /b 1
)

if not exist public\_redirects (
    echo [ATTENTION] Creation de public\_redirects
    if not exist public mkdir public
    echo /*    /index.html   200 > public\_redirects
)

if not exist dist\index.html (
    echo [ERREUR] dist\index.html manquant
    pause
    exit /b 1
)
echo [OK] Tous les fichiers sont presents

REM Étape 5 : Déploiement
echo.
echo [5/5] Deploiement vers Vercel
echo.
echo Options de deploiement :
echo   1) Production (timepulsesports.com)
echo   2) Preview (URL temporaire pour test)
echo.
set /p choice="Choisissez (1 ou 2) : "

if "%choice%"=="1" (
    echo.
    echo [PRODUCTION] Deploiement en production...
    call vercel --prod --yes
) else if "%choice%"=="2" (
    echo.
    echo [PREVIEW] Deploiement en preview...
    call vercel --yes
) else (
    echo [ERREUR] Choix invalide
    pause
    exit /b 1
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERREUR] Le deploiement a echoue
    echo.
    echo Verifiez :
    echo   1. Que vous etes connecte a Vercel (vercel login)
    echo   2. Que le projet est correctement lie (vercel link)
    echo   3. Les logs d'erreur ci-dessus
    pause
    exit /b 1
)

REM Succès
echo.
echo ============================================
echo   Deploiement termine avec succes !
echo ============================================
echo.
echo Verifications a faire :
echo   1. Ouvrir le site
echo   2. Naviguer vers /admin ou /events
echo   3. Dupliquer l'onglet (Ctrl + Shift + D)
echo   4. Verifier qu'il n'y a pas d'erreur 404
echo.
echo Pour voir les logs :
echo   vercel logs https://timepulsesports.com
echo.
pause
