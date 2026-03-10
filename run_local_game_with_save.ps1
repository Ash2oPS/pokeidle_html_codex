param(
  [int]$WebPort = 5317
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$previousSavePort = $env:POKEIDLE_SAVE_PORT
$env:POKEIDLE_SAVE_PORT = "38475"
$saveBridge = Start-Process -FilePath node -ArgumentList 'save_bridge_server.mjs' -WorkingDirectory $root -PassThru
if ($null -eq $previousSavePort) {
  Remove-Item Env:\POKEIDLE_SAVE_PORT -ErrorAction SilentlyContinue
} else {
  $env:POKEIDLE_SAVE_PORT = $previousSavePort
}

$bridgeReady = $false
for ($i = 0; $i -lt 25; $i++) {
  Start-Sleep -Milliseconds 120
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:38475/health" -Method GET -TimeoutSec 1
    if ($health -and $health.ok -eq $true) {
      $bridgeReady = $true
      break
    }
  } catch {}
}

if (-not $bridgeReady) {
  Stop-Process -Id $saveBridge.Id -Force -ErrorAction SilentlyContinue
  throw "Le save bridge n'a pas demarre correctement sur le port 38475."
}

$webServer = Start-Process -FilePath py -ArgumentList @('-3','-m','http.server',"$WebPort",'--bind','127.0.0.1') -WorkingDirectory $root -PassThru
$webReady = $false
for ($i = 0; $i -lt 80; $i++) {
  Start-Sleep -Milliseconds 250
  try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:$WebPort" -Method GET -TimeoutSec 2
    $webReady = $true
    break
  } catch {}
}

if (-not $webReady) {
  Stop-Process -Id $webServer.Id -Force -ErrorAction SilentlyContinue
  Stop-Process -Id $saveBridge.Id -Force -ErrorAction SilentlyContinue
  throw "Le serveur statique n'a pas demarre correctement sur le port $WebPort."
}

Write-Host "Save bridge: http://127.0.0.1:38475 (AppData\\Roaming\\PokeIdle)"
Write-Host "Game server:  http://127.0.0.1:$WebPort (http.server)"
Write-Host ""
Write-Host "Appuie sur ENTREE pour stopper les 2 serveurs..."
[void](Read-Host)

Stop-Process -Id $webServer.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $saveBridge.Id -Force -ErrorAction SilentlyContinue
