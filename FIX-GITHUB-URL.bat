@echo off
echo ============================================
echo   CORRECTION DE L'URL GITHUB
echo ============================================
echo.

cd "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

echo [1/3] Verification de l'URL actuelle...
git remote -v

echo.
echo [2/3] Changement vers le bon depot GitHub...
git remote set-url origin https://github.com/MickaelTimepulse/inscription-en-ligne-timepulsev2.git

echo.
echo [3/3] Verification de la nouvelle URL...
git remote -v

echo.
echo ============================================
echo   URL CORRIGEE !
echo ============================================
echo.
echo Vous pouvez maintenant pousser avec:
echo   git push origin main
echo.
echo Ou double-cliquer sur push-github.bat
echo.
pause
