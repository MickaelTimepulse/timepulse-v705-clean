@echo off
echo ========================================================
echo REINITIALISATION GIT - VERSION FINALE
echo Suppression de src.zip AVANT le commit
echo ========================================================
echo.

cd /d "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

echo Etape 1 : Verification de src.zip...
if exist src.zip (
    echo ATTENTION : src.zip existe dans le projet
    echo Suppression de src.zip...
    del /f /q src.zip
    if exist src.zip (
        echo ERREUR : Impossible de supprimer src.zip
        echo Supprime-le manuellement puis relance ce script
        pause
        exit /b 1
    )
    echo OK : src.zip supprime
) else (
    echo OK : src.zip n'existe pas
)
echo.

echo Etape 2 : Ajout de src.zip au .gitignore...
findstr /C:"src.zip" .gitignore >nul 2>&1
if errorlevel 1 (
    echo src.zip >> .gitignore
    echo OK : src.zip ajoute au .gitignore
) else (
    echo OK : src.zip deja dans .gitignore
)
echo.

echo Etape 3 : Sauvegarde de l'URL du depot distant...
for /f "tokens=*" %%i in ('git remote get-url origin 2^>nul') do set REMOTE_URL=%%i
if "%REMOTE_URL%"=="" (
    set REMOTE_URL=https://github.com/MickaelTimepulse/timepulse-v705-clean.git
)
echo URL : %REMOTE_URL%
echo.

echo Etape 4 : Suppression du dossier .git...
rmdir /s /q .git
if exist .git (
    echo ERREUR : Impossible de supprimer .git
    echo Ferme tous les programmes qui utilisent le projet
    pause
    exit /b 1
)
echo OK : .git supprime
echo.

echo Etape 5 : Initialisation d'un nouveau depot Git...
git init
git branch -M main
echo OK : Nouveau depot cree
echo.

echo Etape 6 : Ajout du depot distant...
git remote add origin %REMOTE_URL%
echo OK : Depot distant configure
echo.

echo Etape 7 : Verification finale - src.zip ne doit PAS etre ajoute...
git add .
git status | findstr "src.zip"
if not errorlevel 1 (
    echo ERREUR : src.zip est toujours dans le commit !
    echo Verifie le fichier .gitignore
    pause
    exit /b 1
)
echo OK : src.zip ne sera pas dans le commit
echo.

echo Etape 8 : Creation du commit initial...
git commit -m "Projet Timepulse - Version propre sans fichiers volumineux"
echo OK : Commit cree
echo.

echo Etape 9 : Push force vers GitHub...
git push -u origin main --force
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
echo Le depot est maintenant propre sur GitHub.
echo src.zip n'a jamais ete envoye.
echo.
echo Tu peux maintenant lancer DEPLOYER-ICI.bat
echo.

pause
