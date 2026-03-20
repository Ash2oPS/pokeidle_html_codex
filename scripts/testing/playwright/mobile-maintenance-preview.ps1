$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
$actionsPath = Join-Path $PSScriptRoot "actions\mobile-portrait.json"
$screenshotDir = Join-Path $repoRoot "output\maintenance-preview\mobile-portrait"
$gameUrl = "http://127.0.0.1:5328/?previewMaintenance=1"

& $runnerPath `
  -RepoRoot $repoRoot `
  -Port 5328 `
  -ActionsPath $actionsPath `
  -ScreenshotDir $screenshotDir `
  -Iterations 1 `
  -PauseMs 350 `
  -GameUrl $gameUrl `
  -ViewportWidth 390 `
  -ViewportHeight 844 `
  -Touch:$true `
  -DeviceScaleFactor 2

exit $LASTEXITCODE
