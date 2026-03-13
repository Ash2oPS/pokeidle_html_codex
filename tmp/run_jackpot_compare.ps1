$ErrorActionPreference = "Stop"

$port = 5322
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$clientPath = Join-Path $codexHome "skills/develop-web-game/scripts/talent_validate.mjs"

if (!(Test-Path $clientPath)) {
  throw "Talent validation client introuvable: $clientPath"
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

  node $clientPath "tmp/talent_scenarios/jackpot_nocap_scenario.json"
  if ($LASTEXITCODE -ne 0) {
    throw "Jackpot no-capture scenario failed."
  }

  node $clientPath "tmp/talent_scenarios/control_nocap_scenario.json"
  if ($LASTEXITCODE -ne 0) {
    throw "Control no-capture scenario failed."
  }
}
finally {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
