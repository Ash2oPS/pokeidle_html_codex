param(
  [Parameter(Mandatory = $true)][string]$RepoRoot,
  [Parameter(Mandatory = $true)][int]$Port,
  [Parameter(Mandatory = $true)][string]$ActionsPath,
  [Parameter(Mandatory = $true)][string]$ScreenshotDir,
  [int]$Iterations = 1,
  [int]$PauseMs = 0,
  [string]$GameUrl = "",
  [int]$ViewportWidth = 1366,
  [int]$ViewportHeight = 768,
  [switch]$Touch,
  [double]$DeviceScaleFactor = 1
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $RepoRoot)) {
  throw "RepoRoot introuvable: $RepoRoot"
}

$clientPath = Join-Path $RepoRoot "scripts/testing/playwright/web-game-playwright-client.mjs"
if (!(Test-Path $clientPath)) {
  throw "Client Playwright introuvable: $clientPath"
}
if (!(Test-Path $ActionsPath)) {
  throw "Fichier d'actions introuvable: $ActionsPath"
}

if (![string]::IsNullOrWhiteSpace($ScreenshotDir)) {
  New-Item -ItemType Directory -Force -Path $ScreenshotDir | Out-Null
}

$server = Start-Process -FilePath py -ArgumentList @('-3', '-m', 'http.server', "$Port", '--bind', '127.0.0.1') -WorkingDirectory $RepoRoot -WindowStyle Hidden -PassThru
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
$touchValue = if ($Touch.IsPresent) { "true" } else { "false" }

try {
  node $clientPath `
    --url $finalGameUrl `
    --actions-file $ActionsPath `
    --iterations $Iterations `
    --pause-ms $PauseMs `
    --screenshot-dir $ScreenshotDir `
    --viewport-width $ViewportWidth `
    --viewport-height $ViewportHeight `
    --touch $touchValue `
    --device-scale-factor $DeviceScaleFactor
  exit $LASTEXITCODE
}
finally {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
