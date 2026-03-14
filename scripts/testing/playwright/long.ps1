$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
$actionsPath = Join-Path $repoRoot "output/long_actions.json"
$screenshotDir = Join-Path $repoRoot "output/web-game-long"

& $runnerPath -RepoRoot $repoRoot -Port 5318 -ActionsPath $actionsPath -ScreenshotDir $screenshotDir -Iterations 1 -PauseMs 0
exit $LASTEXITCODE
