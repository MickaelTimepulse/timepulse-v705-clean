@echo off
REM Script de push rapide - Commit et push en une commande
REM Usage: quick-push.bat "votre message de commit"

if "%~1"=="" (
    set message=Update %date% %time%
) else (
    set message=%~1
)

echo Commit et push: %message%
git add . && git commit -m "%message%" && git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ✓ Push reussi vers GitHub !
) else (
    echo.
    echo ✗ Erreur lors du push
)
