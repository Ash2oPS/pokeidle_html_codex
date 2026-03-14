$ErrorActionPreference = "Stop"
$scriptPath = Join-Path $PSScriptRoot "scripts/testing/playwright/ko.ps1"
& $scriptPath @args
exit $LASTEXITCODE
