@echo off
echo ============================================
echo   PUSH AUTOMATIQUE VERS GITHUB
echo   Repository: timepulse-v705-clean
echo ============================================
echo.

echo [1/4] Ajout des fichiers modifies...
git add .

echo.
echo [2/4] Creation du commit...
set /p message="Message du commit (ou appuyez sur Entree pour message auto): "
if "%message%"=="" set message=Mise a jour automatique du %date% %time%
git commit -m "%message%"

echo.
echo [3/4] Configuration du remote GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/MickaelTimepulse/timepulse-v705-clean.git

echo.
echo [4/4] Push vers GitHub (timepulse-v705-clean)...
git push -u origin main

echo.
echo ============================================
echo   TERMINE !
echo ============================================
pause
