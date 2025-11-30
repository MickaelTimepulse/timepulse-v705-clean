@echo off
echo ========================================================
echo NETTOYAGE GIT RAPIDE
echo Push force vers GitHub sans nettoyage local
echo ========================================================
echo.

cd /d "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

echo src.zip a deja ete supprime de l'historique Git.
echo.
echo On passe directement au push force vers GitHub...
echo.

echo Etape 1 : Verification de l'historique...
git log --all --oneline --name-only | findstr "src.zip" >nul
if errorlevel 1 (
    echo OK : src.zip n'est plus dans l'historique !
) else (
    echo ATTENTION : src.zip est encore present
    echo Relance NETTOYER-HISTORIQUE-GIT.bat
    pause
    exit /b 1
)
echo.

echo Etape 2 : Push force vers GitHub...
echo.
git push origin main --force
if errorlevel 1 (
    echo.
    echo ERREUR lors du push
    pause
    exit /b 1
)

echo.
echo ========================================================
echo PUSH REUSSI !
echo ========================================================
echo.
echo Tu peux maintenant lancer DEPLOYER-ICI.bat
echo.

pause
