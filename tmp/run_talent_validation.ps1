$ErrorActionPreference = "Stop"

$port = 5321
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$clientPath = Join-Path $codexHome "skills/develop-web-game/scripts/web_game_playwright_client.js"
$actionsPath = Join-Path $codexHome "skills/develop-web-game/references/action_payloads.json"

if (!(Test-Path $clientPath)) {
  throw "Playwright client introuvable: $clientPath"
}
if (!(Test-Path $actionsPath)) {
  throw "Fichier actions introuvable: $actionsPath"
}
$server = Start-Process -FilePath py -ArgumentList @("-3", "-m", "http.server", "$port", "--bind", "127.0.0.1") -WorkingDirectory "." -PassThru

try {
  $ready = $false
  for ($i = 0; $i -lt 80; $i++) {
    Start-Sleep -Milliseconds 200
    try {
      $null = Invoke-WebRequest -Uri "http://127.0.0.1:$port" -UseBasicParsing -TimeoutSec 2
      $ready = $true
      break
    } catch {
      # Retry until server is ready.
    }
  }
  if (-not $ready) {
    throw "Static server not ready on port $port."
  }

  node $clientPath --url "http://127.0.0.1:5321/?dev_seed_save=tmp/pokeidle-test-appdata/PokeIdle/save_jackpot_route5.json" --actions-file $actionsPath --iterations 160 --pause-ms 100 --screenshot-dir "output/web-game-jackpot-validate"
  if ($LASTEXITCODE -ne 0) {
    throw "Jackpot scenario failed."
  }

  node $clientPath --url "http://127.0.0.1:5321/?dev_seed_save=tmp/pokeidle-test-appdata/PokeIdle/save_control_route5.json" --actions-file $actionsPath --iterations 160 --pause-ms 100 --screenshot-dir "output/web-game-control-validate"
  if ($LASTEXITCODE -ne 0) {
    throw "Control scenario failed."
  }

  node $clientPath --url "http://127.0.0.1:5321/?dev_seed_save=tmp/pokeidle-test-appdata/PokeIdle/save_teleport_route24.json" --actions-file $actionsPath --iterations 220 --pause-ms 100 --screenshot-dir "output/web-game-teleport-validate"
  if ($LASTEXITCODE -ne 0) {
    throw "Teleport scenario failed."
  }
}
finally {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
