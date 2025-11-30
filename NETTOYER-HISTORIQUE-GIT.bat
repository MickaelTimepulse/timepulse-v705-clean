@echo off
echo ========================================================
echo NETTOYAGE COMPLET HISTORIQUE GIT
echo Suppression de src.zip de tout l'historique
echo ========================================================
echo.

cd /d "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

echo Dossier actuel : %CD%
echo.

echo ATTENTION : Cette operation va reecrire l'historique Git.
echo Cela peut prendre quelques minutes.
echo.
set /p CONTINUE="Continuer ? (o/n) "
if /i not "%CONTINUE%"=="o" (
    echo Operation annulee
    pause
    exit /b 0
)
echo.

echo Etape 1 : Suppression de src.zip de l'historique Git...
echo.
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch src.zip" --prune-empty --tag-name-filter cat -- --all
echo.

echo Etape 2 : Nettoyage des references...
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
echo.

echo Etape 3 : Verification que src.zip n'est plus present...
git log --all --oneline --name-only | findstr "src.zip" >nul
if errorlevel 1 (
    echo src.zip supprime avec succes de l'historique !
) else (
    echo ATTENTION : src.zip est encore present dans l'historique
)
echo.

echo Etape 4 : Push force vers GitHub...
echo.
git push origin main --force
if errorlevel 1 (
    echo.
    echo ERREUR lors du push force
    echo.
    echo Verifie ta connexion GitHub et reessaie.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo NETTOYAGE REUSSI !
echo ========================================================
echo.
echo L'historique Git a ete nettoye.
echo src.zip a ete supprime completement.
echo.
echo Tu peux maintenant relancer DEPLOYER-ICI.bat
echo.

pause
