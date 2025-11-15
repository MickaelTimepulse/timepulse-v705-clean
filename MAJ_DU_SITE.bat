@echo off
REM ============================================
REM TIMEPULSE - DEPLOIEMENT DIRECT VERCEL
REM ============================================
REM Double-cliquer pour deployer en production
REM ============================================

echo.
echo ================================================
echo    DEPLOIEMENT TIMEPULSE SUR VERCEL
echo ================================================
echo.

REM Afficher le repertoire actuel
echo Repertoire de travail : %CD%
echo.

REM Etape 1 : Build du projet
echo [1/2] Construction du projet...
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
echo [2/2] Deploiement en production sur Vercel...
echo.
call npx vercel --prod --yes
if errorlevel 1 (
    echo.
    echo [ERREUR] Le deploiement a echoue !
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================
echo    DEPLOIEMENT TERMINE !
echo ================================================
echo.
echo Ton site est en ligne sur :
echo   https://www.timepulsesports.com
echo.
echo Vide ton cache navigateur :
echo   Chrome/Edge : Ctrl + Shift + R
echo   Firefox     : Ctrl + Shift + R
echo.
pause
