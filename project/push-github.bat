@echo off
echo ============================================
echo   AUTO-COMMIT ET PUSH GITHUB
echo ============================================
echo.

cd "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\project"

echo [1/3] Ajout des fichiers modifies...
git add .

echo.
echo [2/3] Creation du commit...
set /p message="Message du commit (ou appuyez sur Entree pour message auto): "
if "%message%"=="" set message=Mise a jour automatique du %date% %time%
git commit -m "%message%"

echo.
echo [3/3] Push vers GitHub (inscription-en-ligne-timepulsev2)...
git remote set-url origin https://github.com/MickaelTimepulse/inscription-en-ligne-timepulsev2.git
git push origin main

echo.
echo ============================================
echo   TERMINE !
echo ============================================
pause
