@echo off
REM ============================================
REM TIMEPULSE - DEPLOIEMENT AUTOMATIQUE COMPLET
REM ============================================
REM Synchronise depuis Bolt puis deploie
REM ============================================

echo.
echo ================================================
echo    DEPLOIEMENT TIMEPULSE SUR VERCEL
echo ================================================
echo.

REM Variables - IMPORTANT: Ce script doit etre lance depuis le dossier Bolt !
set "BOLT_PATH=%~dp0"
set "LOCAL_PATH=C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

echo Repertoire de travail : %BOLT_PATH%
echo.

REM Etape 0 : Synchronisation depuis Bolt
echo [0/3] Synchronisation des fichiers depuis Bolt...
echo.
echo Copie des fichiers mis a jour...

REM Copier les fichiers de layout
xcopy /Y /I "%BOLT_PATH%src\components\Layout\*.tsx" "%LOCAL_PATH%\src\components\Layout\" >nul 2>&1

REM Copier App.tsx et main.tsx
xcopy /Y "%BOLT_PATH%src\App.tsx" "%LOCAL_PATH%\src\" >nul 2>&1
xcopy /Y "%BOLT_PATH%src\main.tsx" "%LOCAL_PATH%\src\" >nul 2>&1

REM Copier les pages Home
xcopy /Y /I "%BOLT_PATH%src\components\Home\*.tsx" "%LOCAL_PATH%\src\components\Home\" >nul 2>&1

REM Copier toutes les pages
xcopy /Y /I "%BOLT_PATH%src\pages\*.tsx" "%LOCAL_PATH%\src\pages\" >nul 2>&1

REM Copier les composants Admin
xcopy /Y /I "%BOLT_PATH%src\components\Admin\*.tsx" "%LOCAL_PATH%\src\components\Admin\" >nul 2>&1

REM Copier tous les composants racine
xcopy /Y /I "%BOLT_PATH%src\components\*.tsx" "%LOCAL_PATH%\src\components\" >nul 2>&1

REM Copier les libs
xcopy /Y /I "%BOLT_PATH%src\lib\*.ts" "%LOCAL_PATH%\src\lib\" >nul 2>&1

REM Copier les contexts
xcopy /Y /I "%BOLT_PATH%src\contexts\*.tsx" "%LOCAL_PATH%\src\contexts\" >nul 2>&1

REM Copier les fichiers de config
xcopy /Y "%BOLT_PATH%package.json" "%LOCAL_PATH%\" >nul 2>&1
xcopy /Y "%BOLT_PATH%vite.config.ts" "%LOCAL_PATH%\" >nul 2>&1
xcopy /Y "%BOLT_PATH%tsconfig.json" "%LOCAL_PATH%\" >nul 2>&1
xcopy /Y "%BOLT_PATH%tailwind.config.js" "%LOCAL_PATH%\" >nul 2>&1
xcopy /Y "%BOLT_PATH%vercel.json" "%LOCAL_PATH%\" >nul 2>&1
xcopy /Y "%BOLT_PATH%index.html" "%LOCAL_PATH%\" >nul 2>&1

echo [OK] Synchronisation terminee !
echo.

REM Aller dans le dossier local pour la suite
cd /d "%LOCAL_PATH%"
echo Repertoire actif : %CD%
echo.

REM Etape 1 : Build du projet
echo [1/3] Construction du projet...
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo [ERREUR] Le build a echoue !
    echo Verifie les erreurs ci-dessus.
    echo.
    pause
    exit /b 1
)
echo.
echo [OK] Build reussi !
echo.

REM Etape 2 : Deploiement sur Vercel
echo [2/3] Deploiement en production sur Vercel...
echo.
echo Verification de la connexion Vercel...
call npx vercel whoami
if errorlevel 1 (
    echo.
    echo [ERREUR] Tu n'es pas connecte a Vercel !
    echo.
    echo SOLUTION : Execute cette commande d'abord :
    echo   npx vercel login
    echo.
    pause
    exit /b 1
)
echo.
echo Lancement du deploiement...
call npx vercel --prod --yes
if errorlevel 1 (
    echo.
    echo [ERREUR] Le deploiement a echoue !
    echo Verifie les messages d'erreur ci-dessus.
    echo.
    pause
    exit /b 1
)

REM Etape 3 : Retour au dossier Bolt
cd /d "%BOLT_PATH%"
echo [3/3] Retour au dossier initial...
echo Repertoire actif : %CD%
echo.

echo.
echo ================================================
echo    DEPLOIEMENT TERMINE !
echo ================================================
echo.
echo Fichiers synchronises depuis Bolt vers ton PC
echo Puis deployes sur Vercel en production
echo.
echo Ton site est en ligne sur :
echo   https://www.timepulsesports.com
echo.
echo ⚠️ IMPORTANT : Vide ton cache navigateur !
echo   Chrome/Edge : Ctrl + Shift + R
echo   Firefox     : Ctrl + Shift + R
echo.
echo Ou teste en navigation privee : Ctrl + Shift + N
echo.
pause
