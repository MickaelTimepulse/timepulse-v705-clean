@echo off
echo ========================================
echo SYNCHRONISATION BOLT vers LOCAL
echo Version 705 - 12/11/2025
echo ========================================
echo.

set "LOCAL_PATH=C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

echo Verification du dossier local...
if not exist "%LOCAL_PATH%" (
    echo ERREUR: Le dossier local n'existe pas!
    echo Chemin: %LOCAL_PATH%
    pause
    exit /b 1
)

echo.
echo ✓ Dossier local trouve
echo.
echo ATTENTION: Ce script va remplacer vos fichiers locaux par la version Bolt
echo Appuyez sur CTRL+C pour annuler, ou
pause

echo.
echo Copie des fichiers principaux...

REM Copier les fichiers de layout
echo - Layout components...
xcopy /Y /I "src\components\Layout\*.tsx" "%LOCAL_PATH%\src\components\Layout\"

REM Copier App.tsx et main.tsx
echo - App principal...
xcopy /Y "src\App.tsx" "%LOCAL_PATH%\src\"
xcopy /Y "src\main.tsx" "%LOCAL_PATH%\src\"

REM Copier les pages Home
echo - Pages Home...
xcopy /Y /I "src\components\Home\*.tsx" "%LOCAL_PATH%\src\components\Home\"

REM Copier toutes les pages
echo - Pages principales...
xcopy /Y /I "src\pages\*.tsx" "%LOCAL_PATH%\src\pages\"

REM Copier les composants Admin
echo - Composants Admin...
xcopy /Y /I "src\components\Admin\*.tsx" "%LOCAL_PATH%\src\components\Admin\"

REM Copier tous les composants racine
echo - Composants racine...
xcopy /Y /I "src\components\*.tsx" "%LOCAL_PATH%\src\components\"

REM Copier les libs
echo - Bibliotheques...
xcopy /Y /I "src\lib\*.ts" "%LOCAL_PATH%\src\lib\"

REM Copier les contexts
echo - Contexts...
xcopy /Y /I "src\contexts\*.tsx" "%LOCAL_PATH%\src\contexts\"

REM Copier les fichiers de config
echo - Configuration...
xcopy /Y "package.json" "%LOCAL_PATH%\"
xcopy /Y "vite.config.ts" "%LOCAL_PATH%\"
xcopy /Y "tsconfig.json" "%LOCAL_PATH%\"
xcopy /Y "tailwind.config.js" "%LOCAL_PATH%\"
xcopy /Y "vercel.json" "%LOCAL_PATH%\"
xcopy /Y "index.html" "%LOCAL_PATH%\"

echo.
echo ========================================
echo ✓ SYNCHRONISATION TERMINEE
echo ========================================
echo.
echo Prochaines etapes:
echo 1. cd "%LOCAL_PATH%"
echo 2. npm install (si necessaire)
echo 3. npm run build
echo 4. npx vercel --prod
echo.
echo La version deployee sera: v705
echo.
pause
