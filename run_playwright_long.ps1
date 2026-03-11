$ErrorActionPreference = "Stop"

$port = 5318
$repoRoot = $PSScriptRoot
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$clientPath = Join-Path $codexHome "skills/develop-web-game/scripts/web_game_playwright_client.js"
$actionsPath = Join-Path $repoRoot "output/long_actions.json"

if (!(Test-Path $clientPath)) {
  throw "Client Playwright introuvable: $clientPath"
}
if (!(Test-Path $actionsPath)) {
  throw "Fichier d'actions introuvable: $actionsPath"
}

$server = Start-Process -FilePath py -ArgumentList @('-3','-m','http.server',"$port",'--bind','127.0.0.1') -WorkingDirectory $repoRoot -PassThru
$serverReady = $false
for ($i = 0; $i -lt 80; $i++) {
  Start-Sleep -Milliseconds 250
  try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:$port" -Method GET -TimeoutSec 2
    $serverReady = $true
    break
  } catch {}
}

if (-not $serverReady) {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  throw "Le serveur statique n'a pas demarre correctement sur le port $port."
}
try {
  node $clientPath --url "http://127.0.0.1:$port" --actions-file $actionsPath --iterations 1 --pause-ms 0 --screenshot-dir "output/web-game-long"
  exit $LASTEXITCODE
}
finally {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
