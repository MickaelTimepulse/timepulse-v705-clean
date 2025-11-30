@echo off
cls
echo.
echo ========================================================================
echo          APPLICATION DES MIGRATIONS SUPABASE - TIMEPULSE
echo ========================================================================
echo.
echo Ce script va :
echo    1. Ouvrir le fichier SQL dans votre editeur
echo    2. Ouvrir Supabase SQL Editor dans votre navigateur
echo.
echo Vous devrez ensuite :
echo    - Copier tout le contenu du fichier SQL (Ctrl+A puis Ctrl+C)
echo    - Coller dans Supabase SQL Editor (Ctrl+V)
echo    - Cliquer sur "Run"
echo.
pause
echo.
echo Ouverture du fichier SQL...
start "" "combined-migrations.sql"
timeout /t 2 /nobreak >nul
echo.
echo Ouverture de Supabase SQL Editor...
start "" "https://supabase.com/dashboard/project/fgstscztsighabpzzzix/sql/new"
echo.
echo Fichiers ouverts !
echo.
echo ========================================================================
echo                        ETAPES A SUIVRE :
echo ========================================================================
echo.
echo ETAPE 1 - Dans l'editeur de texte :
echo    - Appuyez sur Ctrl+A (tout selectionner)
echo    - Appuyez sur Ctrl+C (copier)
echo.
echo ETAPE 2 - Dans Supabase SQL Editor (navigateur) :
echo    - Appuyez sur Ctrl+V (coller)
echo    - Cliquez sur le bouton "Run"
echo    - Attendez 1-2 minutes
echo.
echo ETAPE 3 - Une fois termine :
echo    - Lancez MAJ_DU_SITE.bat
echo    - Testez votre application !
echo.
echo NOTE : Si vous voyez des erreurs "already exists", c'est normal !
echo        L'important est que l'execution se termine.
echo.
echo Besoin d'aide ? Consultez SOLUTION-SIMPLE.md
echo.
echo ========================================================================
echo.
pause
