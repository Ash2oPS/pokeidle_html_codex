$ErrorActionPreference = "Stop"
$scriptPath = Join-Path $PSScriptRoot "scripts/testing/playwright/check.ps1"
& $scriptPath @args
exit $LASTEXITCODE
