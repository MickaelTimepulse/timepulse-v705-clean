# SYNCHRONISATION BOLT vers LOCAL
# Version 705 - 12/11/2025

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SYNCHRONISATION BOLT vers LOCAL" -ForegroundColor Cyan
Write-Host "Version 705 - 12/11/2025" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$LocalPath = "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"
$BoltPath = $PSScriptRoot

Write-Host "Verification du dossier local..." -ForegroundColor Yellow
if (-not (Test-Path $LocalPath)) {
    Write-Host "ERREUR: Le dossier local n'existe pas!" -ForegroundColor Red
    Write-Host "Chemin: $LocalPath" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✓ Dossier local trouve" -ForegroundColor Green
Write-Host ""
Write-Host "ATTENTION: Ce script va remplacer vos fichiers locaux par la version Bolt" -ForegroundColor Yellow
Write-Host "Appuyez sur une touche pour continuer ou CTRL+C pour annuler..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Copie des fichiers..." -ForegroundColor Yellow

# Fonction de copie avec verification
function Copy-WithVerify {
    param($Source, $Dest, $Description)

    if (Test-Path $Source) {
        Write-Host "  ✓ $Description" -ForegroundColor Green
        Copy-Item -Path $Source -Destination $Dest -Recurse -Force
    } else {
        Write-Host "  ✗ $Description (source introuvable)" -ForegroundColor Red
    }
}

# Creer les dossiers si necessaire
$folders = @(
    "$LocalPath\src\components\Layout",
    "$LocalPath\src\components\Home",
    "$LocalPath\src\components\Admin",
    "$LocalPath\src\pages",
    "$LocalPath\src\lib",
    "$LocalPath\src\contexts"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
}

# Copier les fichiers
Copy-WithVerify "$BoltPath\src\components\Layout\Header.tsx" "$LocalPath\src\components\Layout\Header.tsx" "Header.tsx"
Copy-WithVerify "$BoltPath\src\components\Layout\Footer.tsx" "$LocalPath\src\components\Layout\Footer.tsx" "Footer.tsx (v705)"

Copy-WithVerify "$BoltPath\src\components\Home\*" "$LocalPath\src\components\Home\" "Composants Home"
Copy-WithVerify "$BoltPath\src\components\Admin\*" "$LocalPath\src\components\Admin\" "Composants Admin"
Copy-WithVerify "$BoltPath\src\components\*.tsx" "$LocalPath\src\components\" "Composants racine"

Copy-WithVerify "$BoltPath\src\pages\*" "$LocalPath\src\pages\" "Pages"
Copy-WithVerify "$BoltPath\src\lib\*" "$LocalPath\src\lib\" "Libraries"
Copy-WithVerify "$BoltPath\src\contexts\*" "$LocalPath\src\contexts\" "Contexts"

Copy-WithVerify "$BoltPath\src\App.tsx" "$LocalPath\src\App.tsx" "App.tsx"
Copy-WithVerify "$BoltPath\src\main.tsx" "$LocalPath\src\main.tsx" "main.tsx"

Copy-WithVerify "$BoltPath\package.json" "$LocalPath\package.json" "package.json"
Copy-WithVerify "$BoltPath\vite.config.ts" "$LocalPath\vite.config.ts" "vite.config.ts"
Copy-WithVerify "$BoltPath\tsconfig.json" "$LocalPath\tsconfig.json" "tsconfig.json"
Copy-WithVerify "$BoltPath\tailwind.config.js" "$LocalPath\tailwind.config.js" "tailwind.config.js"
Copy-WithVerify "$BoltPath\vercel.json" "$LocalPath\vercel.json" "vercel.json"
Copy-WithVerify "$BoltPath\index.html" "$LocalPath\index.html" "index.html"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ SYNCHRONISATION TERMINEE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "1. cd '$LocalPath'" -ForegroundColor White
Write-Host "2. npm install (si necessaire)" -ForegroundColor White
Write-Host "3. npm run build" -ForegroundColor White
Write-Host "4. npx vercel --prod" -ForegroundColor White
Write-Host ""
Write-Host "La version deployee sera: v705" -ForegroundColor Cyan
Write-Host ""
pause
