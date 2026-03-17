$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
$actionsPath = Join-Path $PSScriptRoot "actions\desktop-landscape.json"
$screenshotDir = Join-Path $repoRoot "output\web-game-poke\desktop-landscape"

& $runnerPath `
  -RepoRoot $repoRoot `
  -Port 5317 `
  -ActionsPath $actionsPath `
  -ScreenshotDir $screenshotDir `
  -Iterations 1 `
  -PauseMs 250 `
  -ViewportWidth 1366 `
  -ViewportHeight 768 `
  -Touch:$false `
  -DeviceScaleFactor 1

exit $LASTEXITCODE
