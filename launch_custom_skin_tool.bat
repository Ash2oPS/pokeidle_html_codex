@echo off
setlocal

cd /d "%~dp0"

start "" cmd /c "timeout /t 2 >nul && start "" http://127.0.0.1:4876/"
npm run tool:custom-skins

