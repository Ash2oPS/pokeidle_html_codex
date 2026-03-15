@echo off
setlocal

cd /d "%~dp0"

set "PORT=4877"
set "TARGET_URL=http://127.0.0.1:%PORT%/route"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERREUR] node introuvable dans le PATH.
  echo Installe Node.js puis relance ce script.
  pause
  exit /b 1
)

for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
  echo [INFO] Arret ancien serveur PID %%p...
  taskkill /PID %%p /F >nul 2>&1
)

echo [INFO] Ouverture de %TARGET_URL%
timeout /t 1 >nul
start "" "%TARGET_URL%"

echo [INFO] Demarrage du serveur Data Studio sur le port %PORT%...
set "DATA_STUDIO_PORT=%PORT%"
node scripts/game-data-studio-server.mjs

exit /b 0
