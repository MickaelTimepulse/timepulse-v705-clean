@echo off
echo ========================================================
echo REINITIALISATION GIT COMPLETE
echo Creation d'un nouveau depot propre
echo ========================================================
echo.

cd /d "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

echo ATTENTION : Cette operation va supprimer le depot Git local
echo et creer un nouveau depot propre sans src.zip
echo.
set /p CONTINUE="Continuer ? (o/n) "
if /i not "%CONTINUE%"=="o" (
    echo Operation annulee
    pause
    exit /b 0
)
echo.

echo Etape 1 : Sauvegarde de l'URL du depot distant...
for /f "tokens=*" %%i in ('git remote get-url origin') do set REMOTE_URL=%%i
echo URL sauvegardee : %REMOTE_URL%
echo.

echo Etape 2 : Suppression du dossier .git...
rmdir /s /q .git
if exist .git (
    echo ERREUR : Impossible de supprimer .git
    echo Ferme tous les programmes qui utilisent le projet
    pause
    exit /b 1
)
echo OK : .git supprime
echo.

echo Etape 3 : Initialisation d'un nouveau depot Git...
git init
git branch -M main
echo OK : Nouveau depot cree
echo.

echo Etape 4 : Ajout du depot distant...
git remote add origin %REMOTE_URL%
echo OK : Depot distant configure
echo.

echo Etape 5 : Ajout de tous les fichiers (sauf src.zip)...
git add .
echo OK : Fichiers ajoutes
echo.

echo Etape 6 : Creation du commit initial...
git commit -m "Reinitialisation complete du projet - src.zip supprime"
echo OK : Commit cree
echo.

echo Etape 7 : Push force vers GitHub...
git push -u origin main --force
if errorlevel 1 (
    echo.
    echo ERREUR lors du push
    echo Verifie ta connexion GitHub
    pause
    exit /b 1
)

echo.
echo ========================================================
echo REINITIALISATION REUSSIE !
echo ========================================================
echo.
echo Le depot Git a ete reinitialise.
echo L'historique est maintenant propre.
echo src.zip n'a jamais existe dans ce nouveau depot.
echo.
echo Tu peux maintenant lancer DEPLOYER-ICI.bat
echo.

pause
