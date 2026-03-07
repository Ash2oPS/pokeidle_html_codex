$ErrorActionPreference = "Stop"

$port = 5317
$repoRoot = $PSScriptRoot
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$clientPath = Join-Path $codexHome "skills/develop-web-game/scripts/web_game_playwright_client.js"
$actionsPath = Join-Path $codexHome "skills/develop-web-game/references/action_payloads.json"

if (!(Test-Path $clientPath)) {
  throw "Client Playwright introuvable: $clientPath"
}
if (!(Test-Path $actionsPath)) {
  throw "Fichier d'actions introuvable: $actionsPath"
}

$server = Start-Process -FilePath py -ArgumentList '-3','-m','http.server',$port -WorkingDirectory $repoRoot -PassThru
Start-Sleep -Seconds 2
try {
  node $clientPath --url "http://127.0.0.1:$port" --actions-file $actionsPath --iterations 3 --pause-ms 250 --screenshot-dir "output/web-game-poke"
  exit $LASTEXITCODE
}
finally {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}