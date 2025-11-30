# SYNCHRONISATION BOLT → LOCAL (PowerShell)
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SYNCHRONISATION BOLT → LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration des chemins
$BoltPath = "/tmp/cc-agent/58635631/project"
$LocalPath = "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\MAJ SITE 10_11_25\project"

Write-Host "[INFO] Source (Bolt): $BoltPath" -ForegroundColor White
Write-Host "[INFO] Destination (Local): $LocalPath" -ForegroundColor White
Write-Host ""

# Vérifier que le dossier local existe
if (-not (Test-Path $LocalPath)) {
    Write-Host "[ERREUR] Le dossier local n'existe pas !" -ForegroundColor Red
    Write-Host "Crée-le d'abord ou vérifie le chemin." -ForegroundColor Yellow
    Read-Host "Appuie sur Entrée pour quitter"
    exit 1
}

# Fonction pour copier un dossier avec rapport
function Copy-FolderWithReport {
    param (
        [string]$Source,
        [string]$Destination,
        [string]$FolderName
    )

    Write-Host "[COPIE] $FolderName..." -ForegroundColor Yellow

    if (Test-Path $Source) {
        # Supprimer le dossier de destination s'il existe
        if (Test-Path $Destination) {
            Remove-Item -Path $Destination -Recurse -Force -ErrorAction SilentlyContinue
        }

        # Copier le dossier
        Copy-Item -Path $Source -Destination $Destination -Recurse -Force

        # Compter les fichiers
        $fileCount = (Get-ChildItem -Path $Destination -Recurse -File).Count
        Write-Host "  ✓ $fileCount fichiers copiés" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Dossier source introuvable, ignoré" -ForegroundColor DarkYellow
    }
}

# Fonction pour copier un fichier avec rapport
function Copy-FileWithReport {
    param (
        [string]$SourceFile,
        [string]$DestFile,
        [string]$FileName
    )

    if (Test-Path $SourceFile) {
        Copy-Item -Path $SourceFile -Destination $DestFile -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ $FileName" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $FileName (non trouvé)" -ForegroundColor DarkYellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ETAPE 1/3 - DOSSIERS SOURCES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Copier les dossiers principaux
Copy-FolderWithReport -Source "$BoltPath\src" -Destination "$LocalPath\src" -FolderName "src/"
Copy-FolderWithReport -Source "$BoltPath\public" -Destination "$LocalPath\public" -FolderName "public/"
Copy-FolderWithReport -Source "$BoltPath\supabase" -Destination "$LocalPath\supabase" -FolderName "supabase/"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ETAPE 2/3 - FICHIERS DE CONFIGURATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Copier les fichiers de configuration
$configFiles = @(
    @{Source = "package.json"; Dest = "package.json"},
    @{Source = "package-lock.json"; Dest = "package-lock.json"},
    @{Source = "tsconfig.json"; Dest = "tsconfig.json"},
    @{Source = "tsconfig.app.json"; Dest = "tsconfig.app.json"},
    @{Source = "tsconfig.node.json"; Dest = "tsconfig.node.json"},
    @{Source = "vite.config.ts"; Dest = "vite.config.ts"},
    @{Source = "tailwind.config.js"; Dest = "tailwind.config.js"},
    @{Source = "postcss.config.js"; Dest = "postcss.config.js"},
    @{Source = "eslint.config.js"; Dest = "eslint.config.js"},
    @{Source = "index.html"; Dest = "index.html"},
    @{Source = ".gitignore"; Dest = ".gitignore"},
    @{Source = ".env"; Dest = ".env"},
    @{Source = "vercel.json"; Dest = "vercel.json"}
)

foreach ($file in $configFiles) {
    Copy-FileWithReport -SourceFile "$BoltPath\$($file.Source)" -DestFile "$LocalPath\$($file.Dest)" -FileName $file.Source
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ETAPE 3/3 - VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Statistiques finales
$srcFiles = (Get-ChildItem -Path "$LocalPath\src" -Recurse -File -ErrorAction SilentlyContinue).Count
$publicFiles = (Get-ChildItem -Path "$LocalPath\public" -Recurse -File -ErrorAction SilentlyContinue).Count
$supabaseFiles = (Get-ChildItem -Path "$LocalPath\supabase" -Recurse -File -ErrorAction SilentlyContinue).Count

Write-Host ""
Write-Host "Fichiers synchronisés :" -ForegroundColor White
Write-Host "  • src/        : $srcFiles fichiers" -ForegroundColor Cyan
Write-Host "  • public/     : $publicFiles fichiers" -ForegroundColor Cyan
Write-Host "  • supabase/   : $supabaseFiles fichiers" -ForegroundColor Cyan
Write-Host "  • config      : $($configFiles.Count) fichiers" -ForegroundColor Cyan

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ SYNCHRONISATION TERMINEE !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaine étape :" -ForegroundColor Yellow
Write-Host "  cd '$LocalPath'" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor White
Write-Host ""

Read-Host "Appuie sur Entrée pour quitter"
