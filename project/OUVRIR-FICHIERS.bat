@echo off
cls
echo.
echo OUVERTURE DES FICHIERS...
echo.
echo 1. Ouverture du fichier SQL...
start "" "combined-migrations.sql"
timeout /t 2 /nobreak >nul
echo.
echo 2. Ouverture de Supabase SQL Editor...
start "" "https://supabase.com/dashboard/project/fgstscztsighabpzzzix/sql/new"
echo.
echo FICHIERS OUVERTS !
echo.
echo MAINTENANT :
echo   1. Dans le fichier SQL : Ctrl+A puis Ctrl+C
echo   2. Dans Supabase : Ctrl+V puis cliquez "Run"
echo.
pause
