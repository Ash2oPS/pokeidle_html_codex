$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
$actionsPath = Join-Path $PSScriptRoot "actions\mobile-ui-gallery.json"
$screenshotDir = Join-Path $repoRoot "output\ui-state-gallery\mobile-portrait"

& $runnerPath `
  -RepoRoot $repoRoot `
  -Port 5327 `
  -ActionsPath $actionsPath `
  -ScreenshotDir $screenshotDir `
  -Iterations 1 `
  -PauseMs 350 `
  -ViewportWidth 390 `
  -ViewportHeight 844 `
  -Touch:$true `
  -DeviceScaleFactor 2

exit $LASTEXITCODE
