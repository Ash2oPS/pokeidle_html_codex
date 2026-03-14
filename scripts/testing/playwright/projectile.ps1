$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
$actionsPath = Join-Path $repoRoot "output/projectile_actions.json"
$screenshotDir = Join-Path $repoRoot "output/web-game-projectile"

& $runnerPath -RepoRoot $repoRoot -Port 5319 -ActionsPath $actionsPath -ScreenshotDir $screenshotDir -Iterations 1 -PauseMs 0
exit $LASTEXITCODE
