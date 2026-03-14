@echo off
setlocal

cd /d "%~dp0"

for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":4876" ^| findstr "LISTENING"') do (
  taskkill /PID %%p /F >nul 2>&1
)

start "" cmd /c "timeout /t 2 >nul && start "" http://127.0.0.1:4876/"
npm run tool:custom-skins
