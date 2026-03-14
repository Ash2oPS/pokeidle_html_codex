$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$actionsPath = Join-Path $codexHome "skills/develop-web-game/references/action_payloads.json"
$screenshotDir = Join-Path $repoRoot "output/web-game-poke"

& $runnerPath -RepoRoot $repoRoot -Port 5317 -ActionsPath $actionsPath -ScreenshotDir $screenshotDir -Iterations 3 -PauseMs 250
exit $LASTEXITCODE
