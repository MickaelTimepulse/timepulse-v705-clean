@echo off
REM ============================================
REM TIMEPULSE - DEPLOIEMENT AUTOMATIQUE WINDOWS
REM ============================================
REM Usage: deploy.bat "Message de commit"
REM ============================================

echo.
echo ================================================
echo    DEPLOIEMENT AUTOMATIQUE TIMEPULSE
echo ================================================
echo.

REM Vérifier si un message est fourni
if "%~1"=="" (
    set COMMIT_MESSAGE=Update: %date% %time%
) else (
    set COMMIT_MESSAGE=%~1
)

echo Message de commit : %COMMIT_MESSAGE%
echo.

REM Étape 1 : Test du build
echo [1/4] Test du build...
call npm run build >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Build echoue
    echo.
    echo Lance manuellement pour voir l'erreur :
    echo   npm run build
    pause
    exit /b 1
)
echo [OK] Build reussi
echo.

REM Étape 2 : Git add
echo [2/4] Ajout des fichiers...
git add .
echo [OK] Fichiers ajoutes
echo.

REM Étape 3 : Git commit
echo [3/4] Creation du commit...
git commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 (
    echo [INFO] Aucun changement a commiter
) else (
    echo [OK] Commit cree
)
echo.

REM Étape 4 : Git push
echo [4/4] Envoi vers GitHub...
git push origin main
if errorlevel 1 (
    echo [ERREUR] Erreur lors du push
    echo.
    echo Si c'est le premier push, lance :
    echo   git push -u origin main
    pause
    exit /b 1
)
echo [OK] Code envoye sur GitHub
echo.

echo ================================================
echo    DEPLOIEMENT LANCE !
echo ================================================
echo.
echo Vercel va deployer automatiquement dans ~2 minutes
echo.
echo Suis le deploiement ici :
echo   https://vercel.com/dashboard
echo.
pause
