$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$scriptPath = Join-Path $repoRoot "scripts\testing\playwright\verify-web-background-runtime.mjs"

node $scriptPath `
  --mode desktop `
  --background-ms 8000 `
  --headless true

exit $LASTEXITCODE
