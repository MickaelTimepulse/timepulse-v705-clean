@echo off
echo ========================================================
echo NETTOYAGE GIT - Suppression des fichiers volumineux
echo ========================================================
echo.

cd /d "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

echo Dossier actuel : %CD%
echo.

echo Etape 1 : Suppression de src.zip du cache Git...
git rm --cached src.zip 2>nul
if errorlevel 1 (
    echo src.zip n'est pas dans le cache Git
) else (
    echo src.zip supprime du cache Git
)
echo.

echo Etape 2 : Suppression des archives du cache Git...
git rm --cached *.zip 2>nul
git rm --cached *.tar.gz 2>nul
git rm --cached BOLT-V705-SOURCE.tar.gz 2>nul
git rm --cached timepulse-deploy.tar.gz 2>nul
git rm --cached timepulse-export.tar.gz 2>nul
echo Archives supprimees du cache Git
echo.

echo Etape 3 : Commit des modifications...
git add .gitignore
git commit -m "chore: Exclusion des archives volumineuses du repository"
echo.

echo Etape 4 : Push vers GitHub...
git push origin main
if errorlevel 1 (
    echo.
    echo ERREUR lors du push
    echo.
    echo Si l'erreur persiste, execute :
    echo   git filter-branch --force --index-filter "git rm --cached --ignore-unmatch src.zip" --prune-empty --tag-name-filter cat -- --all
    echo   git push origin main --force
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo NETTOYAGE REUSSI !
echo ========================================================
echo.
echo Les fichiers volumineux ont ete exclus du repository.
echo Tu peux maintenant relancer DEPLOYER-ICI.bat
echo.

pause
