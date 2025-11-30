@echo off
chcp 65001 >nul
echo ========================================
echo SYNCHRONISATION BOLT → LOCAL
echo ========================================
echo.

REM Définir les chemins
set "BOLT_PATH=/tmp/cc-agent/58635631/project"
set "LOCAL_PATH=C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

echo [INFO] Source (Bolt): %BOLT_PATH%
echo [INFO] Destination (Local): %LOCAL_PATH%
echo.

REM Vérifier que le dossier local existe
if not exist "%LOCAL_PATH%" (
    echo [ERREUR] Le dossier local n'existe pas !
    echo Crée-le d'abord ou vérifie le chemin.
    pause
    exit /b 1
)

echo [ETAPE 1/3] Copie des fichiers sources (src/)...
robocopy "%BOLT_PATH%\src" "%LOCAL_PATH%\src" /MIR /NFL /NDL /NJH /NJS /NC /NS /NP

echo.
echo [ETAPE 2/3] Copie des fichiers publics (public/)...
robocopy "%BOLT_PATH%\public" "%LOCAL_PATH%\public" /MIR /NFL /NDL /NJH /NJS /NC /NS /NP

echo.
echo [ETAPE 3/3] Copie des fichiers de configuration...
copy /Y "%BOLT_PATH%\package.json" "%LOCAL_PATH%\package.json" >nul
copy /Y "%BOLT_PATH%\package-lock.json" "%LOCAL_PATH%\package-lock.json" >nul
copy /Y "%BOLT_PATH%\tsconfig.json" "%LOCAL_PATH%\tsconfig.json" >nul
copy /Y "%BOLT_PATH%\tsconfig.app.json" "%LOCAL_PATH%\tsconfig.app.json" >nul
copy /Y "%BOLT_PATH%\tsconfig.node.json" "%LOCAL_PATH%\tsconfig.node.json" >nul
copy /Y "%BOLT_PATH%\vite.config.ts" "%LOCAL_PATH%\vite.config.ts" >nul
copy /Y "%BOLT_PATH%\tailwind.config.js" "%LOCAL_PATH%\tailwind.config.js" >nul
copy /Y "%BOLT_PATH%\postcss.config.js" "%LOCAL_PATH%\postcss.config.js" >nul
copy /Y "%BOLT_PATH%\index.html" "%LOCAL_PATH%\index.html" >nul
copy /Y "%BOLT_PATH%\.env" "%LOCAL_PATH%\.env" >nul 2>nul
copy /Y "%BOLT_PATH%\.gitignore" "%LOCAL_PATH%\.gitignore" >nul

echo.
echo ========================================
echo SYNCHRONISATION TERMINEE !
echo ========================================
echo.
echo Tous les fichiers de Bolt ont ete copies vers ton PC local.
echo Tu peux maintenant lancer : npm run build
echo.
pause
