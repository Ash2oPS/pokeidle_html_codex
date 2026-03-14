@echo off
setlocal

cd /d "%~dp0"

set "PORT=4877"
set "TARGET_URL=http://127.0.0.1:%PORT%/talents"

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] npm introuvable dans le PATH.
  echo Installe Node.js puis relance ce script.
  pause
  exit /b 1
)

for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  echo [INFO] Arret ancien serveur PID %%p...
  taskkill /PID %%p /F >nul 2>&1
)

echo [INFO] Demarrage du serveur Data Studio...
start "PokeIdle Data Studio" /min cmd /c "cd /d \"%~dp0\" && npm run tool:data-studio"

echo [INFO] Ouverture de %TARGET_URL%
timeout /t 1 >nul
start "" "%TARGET_URL%"

exit /b 0
