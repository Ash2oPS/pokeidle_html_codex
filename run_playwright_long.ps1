$ErrorActionPreference = "Stop"
$scriptPath = Join-Path $PSScriptRoot "scripts/testing/playwright/long.ps1"
& $scriptPath @args
exit $LASTEXITCODE
