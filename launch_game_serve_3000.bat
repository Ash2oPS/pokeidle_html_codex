@echo off
setlocal EnableDelayedExpansion

cd /d "%~dp0"

set "PORT=3000"
call :GetLocalIPv4
if not defined HOST set "HOST=127.0.0.1"

set "URL=http://%HOST%:%PORT%/"
echo Starting server at %URL%

start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
npx --yes serve . --listen %PORT%
goto :eof

:GetLocalIPv4
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4 Address" /C:"Adresse IPv4"') do (
    set "IP=%%A"
    set "IP=!IP: =!"
    if not "!IP!"=="" if /I not "!IP:~0,7!"=="169.254" if /I not "!IP!"=="127.0.0.1" (
        set "HOST=!IP!"
        goto :eof
    )
)
exit /b
