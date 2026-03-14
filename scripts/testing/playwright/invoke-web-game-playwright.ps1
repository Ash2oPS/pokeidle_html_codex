param(
  [Parameter(Mandatory = $true)][string]$RepoRoot,
  [Parameter(Mandatory = $true)][int]$Port,
  [Parameter(Mandatory = $true)][string]$ActionsPath,
  [Parameter(Mandatory = $true)][string]$ScreenshotDir,
  [int]$Iterations = 1,
  [int]$PauseMs = 0,
  [string]$GameUrl = ""
)

$ErrorActionPreference = "Stop"

$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$clientPath = Join-Path $codexHome "skills/develop-web-game/scripts/web_game_playwright_client.js"

if (!(Test-Path $clientPath)) {
  throw "Client Playwright introuvable: $clientPath"
}
if (!(Test-Path $ActionsPath)) {
  throw "Fichier d'actions introuvable: $ActionsPath"
}

if (![string]::IsNullOrWhiteSpace($ScreenshotDir)) {
  New-Item -ItemType Directory -Force -Path $ScreenshotDir | Out-Null
}

$server = Start-Process -FilePath py -ArgumentList @('-3', '-m', 'http.server', "$Port", '--bind', '127.0.0.1') -WorkingDirectory $RepoRoot -PassThru
$serverReady = $false
for ($i = 0; $i -lt 80; $i++) {
  Start-Sleep -Milliseconds 250
  try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:$Port" -Method GET -TimeoutSec 2
    $serverReady = $true
    break
  }
  catch {
  }
}

if (-not $serverReady) {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  throw "Le serveur statique n'a pas demarre correctement sur le port $Port."
}

$finalGameUrl = if ([string]::IsNullOrWhiteSpace($GameUrl)) { "http://127.0.0.1:$Port" } else { $GameUrl }

try {
  node $clientPath --url $finalGameUrl --actions-file $ActionsPath --iterations $Iterations --pause-ms $PauseMs --screenshot-dir $ScreenshotDir
  exit $LASTEXITCODE
}
finally {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
