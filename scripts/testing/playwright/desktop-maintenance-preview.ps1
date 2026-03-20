$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
$actionsPath = Join-Path $PSScriptRoot "actions\desktop-landscape.json"
$screenshotDir = Join-Path $repoRoot "output\maintenance-preview\desktop-landscape"
$gameUrl = "http://127.0.0.1:5327/?previewMaintenance=1"

& $runnerPath `
  -RepoRoot $repoRoot `
  -Port 5327 `
  -ActionsPath $actionsPath `
  -ScreenshotDir $screenshotDir `
  -Iterations 1 `
  -PauseMs 250 `
  -GameUrl $gameUrl `
  -ViewportWidth 1366 `
  -ViewportHeight 768 `
  -Touch:$false `
  -DeviceScaleFactor 1

exit $LASTEXITCODE
