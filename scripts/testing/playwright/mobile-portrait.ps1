$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
$actionsPath = Join-Path $PSScriptRoot "actions\mobile-portrait.json"
$screenshotDir = Join-Path $repoRoot "output\web-game-poke\mobile-portrait"

& $runnerPath `
  -RepoRoot $repoRoot `
  -Port 5318 `
  -ActionsPath $actionsPath `
  -ScreenshotDir $screenshotDir `
  -Iterations 1 `
  -PauseMs 350 `
  -ViewportWidth 390 `
  -ViewportHeight 844 `
  -Touch:$true `
  -DeviceScaleFactor 2

exit $LASTEXITCODE
