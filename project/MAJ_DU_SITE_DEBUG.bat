@echo off
REM ============================================
REM TIMEPULSE - DIAGNOSTIC DEPLOIEMENT
REM ============================================

echo.
echo ================================================
echo    DIAGNOSTIC DEPLOIEMENT TIMEPULSE
echo ================================================
echo.

REM Variables
set "BOLT_PATH=%~dp0"
set "LOCAL_PATH=C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

echo [INFO] Dossier Bolt : %BOLT_PATH%
echo [INFO] Dossier Local : %LOCAL_PATH%
echo.

REM Verification du dossier local
if not exist "%LOCAL_PATH%" (
    echo [ERREUR] Le dossier local n'existe pas !
    echo Verifie le chemin : %LOCAL_PATH%
    pause
    exit /b 1
)

echo [OK] Dossier local existe
echo.

REM Aller dans le dossier local
cd /d "%LOCAL_PATH%"
echo [INFO] Repertoire actif : %CD%
echo.

REM Verifier si Vercel CLI est installe
echo [TEST] Verification Vercel CLI...
call npx vercel --version
if errorlevel 1 (
    echo.
    echo [ERREUR] Vercel CLI n'est pas accessible !
    echo.
    echo SOLUTION : Installe Vercel CLI avec :
    echo   npm install -g vercel
    echo.
    pause
    exit /b 1
)
echo [OK] Vercel CLI detecte
echo.

REM Verifier la connexion Vercel
echo [TEST] Verification connexion Vercel...
call npx vercel whoami
if errorlevel 1 (
    echo.
    echo [ERREUR] Non connecte a Vercel !
    echo.
    echo SOLUTION : Connecte-toi avec :
    echo   npx vercel login
    echo.
    pause
    exit /b 1
)
echo [OK] Connecte a Vercel
echo.

echo ================================================
echo    TOUS LES TESTS SONT OK !
echo ================================================
echo.
echo Tu peux maintenant utiliser MAJ_DU_SITE.bat
echo.
pause
