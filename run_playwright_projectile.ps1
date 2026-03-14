$ErrorActionPreference = "Stop"
$scriptPath = Join-Path $PSScriptRoot "scripts/testing/playwright/projectile.ps1"
& $scriptPath @args
exit $LASTEXITCODE
