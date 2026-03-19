$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$galleryRoot = Join-Path $repoRoot "output\vfx-combat-gallery\desktop-landscape"
$perfStateDir = Join-Path $galleryRoot "perf"
$runnerPath = Join-Path $PSScriptRoot "vfx-combat-gallery.ps1"

& $runnerPath `
  -RepoRoot $repoRoot `
  -GalleryRoot $galleryRoot `
  -PerfStateDir $perfStateDir `
  -Port 5331 `
  -ViewportWidth 1366 `
  -ViewportHeight 768 `
  -DeviceScaleFactor 1

exit $LASTEXITCODE

