@echo off
setlocal enabledelayedexpansion

:: Navigation vers le dossier du projet
cd /d "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

echo.
echo ========================================================
echo    DEPLOIEMENT COMPLET TIMEPULSE V2
echo ========================================================
echo.
echo Dossier actuel : %CD%
echo.

:: Verification que package.json existe
if not exist "package.json" (
    echo ERREUR : package.json introuvable dans ce dossier !
    echo Verifie que tu es dans le bon repertoire.
    pause
    exit /b 1
)

echo Package.json detecte - OK
echo.

:: ETAPE 1 : BUILD
echo ========================================================
echo ETAPE 1/4 : Build du projet
echo ========================================================
echo.

echo Compilation en cours...
call npm run build
if errorlevel 1 (
    echo.
    echo ERREUR lors du build. Deploiement annule.
    pause
    exit /b 1
)

echo Build reussi !
echo.

:: ETAPE 2 : GIT
echo ========================================================
echo ETAPE 2/4 : Git Commit et Push
echo ========================================================
echo.

if exist ".git" (
    echo Statut Git :
    git status --short
    echo.

    echo Message du commit :
    echo   feat: Systeme de reservation et file d'attente + Fix frais de service
    echo.

    set /p CONTINUE="Continuer avec ce commit ? (o/n) "
    if /i "!CONTINUE!"=="o" (
        echo Ajout des fichiers...
        git add .

        echo Creation du commit...
        git commit -m "feat: Systeme de reservation et file d'attente + Fix frais de service" -m "- Fix: Correction des frais de service en double" -m "- Feature: Suppression automatique des paniers expires (cron)" -m "- Feature: Systeme de reservation de places" -m "- Feature: File d'attente intelligente" -m "- Feature: Composant RaceWaitlistModal"

        echo Push vers GitHub...
        git push origin main
        if errorlevel 1 (
            echo ERREUR lors du push GitHub
            pause
            exit /b 1
        )

        echo Push GitHub reussi !
        echo.
    ) else (
        echo Commit GitHub ignore
        echo.
    )
) else (
    echo Pas de repository Git detecte
    echo.
)

:: ETAPE 3 : VERCEL CHECK
echo ========================================================
echo ETAPE 3/4 : Verification Vercel
echo ========================================================
echo.

where vercel >nul 2>&1
if errorlevel 1 (
    echo ERREUR: Vercel CLI non installe
    echo Installation via : npm i -g vercel
    pause
    exit /b 1
)

echo Vercel CLI detecte

echo Verification de la connexion...
vercel whoami >nul 2>&1
if errorlevel 1 (
    echo Non connecte a Vercel
    echo Connexion en cours...
    vercel login
) else (
    echo Connecte a Vercel
)
echo.

:: ETAPE 4 : DEPLOY
echo ========================================================
echo ETAPE 4/4 : Deploiement Vercel Production
echo ========================================================
echo.

echo Domaines configures :
echo    - timepulsesports.com
echo.

set /p DEPLOY="Lancer le deploiement en PRODUCTION ? (o/n) "
if /i "!DEPLOY!"=="o" (
    echo Deploiement en cours...
    echo.

    vercel --prod --yes
    if errorlevel 1 (
        echo.
        echo ERREUR lors du deploiement Vercel
        pause
        exit /b 1
    )

    echo.
    echo ========================================================
    echo    DEPLOIEMENT REUSSI !
    echo ========================================================
    echo.
    echo Site deploye sur : https://timepulsesports.com
    echo.
    echo Prochaines etapes :
    echo    1. Tester le site en production
    echo    2. Verifier le job cron Supabase
    echo    3. Tester le panier et la file d'attente
    echo.
) else (
    echo Deploiement Vercel ignore
    echo.
)

echo ========================================================
echo RESUME
echo ========================================================
echo.
echo Build compile
echo GitHub mis a jour
echo Vercel deploye
echo.
echo IMPORTANT :
echo    1. Activer les quotas : UPDATE races SET has_quota = true
echo    2. Verifier le cron : SELECT * FROM cron.job
echo    3. Tester la file d'attente
echo.

pause
