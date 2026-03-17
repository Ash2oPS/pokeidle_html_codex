$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
$actionsPath = Join-Path $PSScriptRoot "actions\desktop-ui-gallery.json"
$screenshotDir = Join-Path $repoRoot "output\ui-state-gallery\desktop-landscape"

& $runnerPath `
  -RepoRoot $repoRoot `
  -Port 5326 `
  -ActionsPath $actionsPath `
  -ScreenshotDir $screenshotDir `
  -Iterations 1 `
  -PauseMs 350 `
  -ViewportWidth 1366 `
  -ViewportHeight 768

exit $LASTEXITCODE
