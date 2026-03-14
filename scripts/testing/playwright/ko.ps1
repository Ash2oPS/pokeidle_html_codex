$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
$actionsPath = Join-Path $repoRoot "output/ko_actions.json"
$screenshotDir = Join-Path $repoRoot "output/web-game-ko"

& $runnerPath -RepoRoot $repoRoot -Port 5320 -ActionsPath $actionsPath -ScreenshotDir $screenshotDir -Iterations 22 -PauseMs 0
exit $LASTEXITCODE
