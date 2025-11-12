@echo off
cd "C:\Users\micka\OneDrive\Bureau\NEW SITE\projet bolt\project"
git add .
git commit -m "Auto-update %date% %time%"
git push origin main
echo Push termine !
pause
