$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$galleryRoot = Join-Path $repoRoot "output\vfx-combat-gallery\mobile-portrait"
$perfStateDir = Join-Path $galleryRoot "perf"
$runnerPath = Join-Path $PSScriptRoot "vfx-combat-gallery.ps1"

& $runnerPath `
  -RepoRoot $repoRoot `
  -GalleryRoot $galleryRoot `
  -PerfStateDir $perfStateDir `
  -Port 5332 `
  -ViewportWidth 390 `
  -ViewportHeight 844 `
  -Touch:$true `
  -DeviceScaleFactor 2

exit $LASTEXITCODE

