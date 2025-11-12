@echo off
echo Nettoyage de tous les caches locaux...
rmdir /s /q .vercel .next .turbo out .cache dist node_modules\.cache node_modules\.vite .vite .vite-cache 2>nul

echo.
echo Rebuild propre...
call npm run build

echo.
echo IMPORTANT: Pour vider le cache Vercel:
echo.
echo 1. Allez sur https://vercel.com/dashboard
echo 2. Ouvrez votre projet timepulsev2
echo 3. Allez dans Settings ^> General
echo 4. Cliquez sur "Clear Build Cache"
echo 5. Revenez dans ce terminal et executez: npm run deploy
echo.
pause
