$ErrorActionPreference = "Stop"
$scriptPath = Join-Path $PSScriptRoot "scripts/testing/playwright/capturechance.ps1"
& $scriptPath @args
exit $LASTEXITCODE
