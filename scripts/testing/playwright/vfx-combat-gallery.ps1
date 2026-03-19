param(
  [Parameter(Mandatory = $true)][string]$RepoRoot,
  [Parameter(Mandatory = $true)][string]$GalleryRoot,
  [Parameter(Mandatory = $true)][string]$PerfStateDir,
  [Parameter(Mandatory = $true)][int]$Port,
  [Parameter(Mandatory = $true)][int]$ViewportWidth,
  [Parameter(Mandatory = $true)][int]$ViewportHeight,
  [switch]$Touch,
  [double]$DeviceScaleFactor = 1
)

$ErrorActionPreference = "Stop"

function Ensure-Directory([string]$PathValue) {
  if (![string]::IsNullOrWhiteSpace($PathValue)) {
    New-Item -ItemType Directory -Force -Path $PathValue | Out-Null
  }
}

function Reset-Directory([string]$PathValue) {
  if ([string]::IsNullOrWhiteSpace($PathValue)) {
    return
  }
  if (Test-Path $PathValue) {
    Remove-Item -Recurse -Force $PathValue
  }
  Ensure-Directory $PathValue
}

function New-CombatSeed([string]$SeedFilePath, [int[]]$TeamIds) {
  $seedBuilderPath = Join-Path $RepoRoot "scripts/testing/playwright/create-vfx-combat-seed.mjs"
  $teamArgument = ($TeamIds | ForEach-Object { [int]$_ }) -join ","
  $lastTickEpochMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  node $seedBuilderPath --output-file $SeedFilePath --team-ids $teamArgument --last-tick-epoch-ms $lastTickEpochMs
  if ($LASTEXITCODE -ne 0) {
    throw "Impossible de generer le seed VFX combat: $SeedFilePath"
  }
}

function Invoke-VfxCombatRun {
  param(
    [Parameter(Mandatory = $true)][string]$ScenarioName,
    [Parameter(Mandatory = $true)][string]$ActionsPath,
    [Parameter(Mandatory = $true)][int[]]$TeamIds,
    [Parameter(Mandatory = $true)][string]$ScenarioOutputDir,
    [Parameter(Mandatory = $true)][int]$PerfStateStartIndex
  )

  $runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
  $scenarioSeedDir = Join-Path $RepoRoot "tmp\vfx-combat-gallery\$ScenarioName\PokeIdle"
  $scenarioSeedPath = Join-Path $scenarioSeedDir "save_main.json"
  Reset-Directory $scenarioSeedDir
  Reset-Directory $ScenarioOutputDir

  New-CombatSeed -SeedFilePath $scenarioSeedPath -TeamIds $TeamIds

  $absoluteSeedPath = (Resolve-Path $scenarioSeedPath).Path
  $relativeSeedPath = $absoluteSeedPath.Substring($RepoRoot.Length).TrimStart("\", "/").Replace("\", "/")
  $encodedSeedPath = [Uri]::EscapeDataString($relativeSeedPath)
  $gameUrl = "http://127.0.0.1:$Port/?dev_seed_save=$encodedSeedPath"

  & $runnerPath `
    -RepoRoot $RepoRoot `
    -Port $Port `
    -ActionsPath $ActionsPath `
    -ScreenshotDir $ScenarioOutputDir `
    -Iterations 1 `
    -PauseMs 250 `
    -ViewportWidth $ViewportWidth `
    -ViewportHeight $ViewportHeight `
    -Touch:([bool]$Touch.IsPresent) `
    -DeviceScaleFactor $DeviceScaleFactor `
    -GameUrl $gameUrl

  if ($LASTEXITCODE -ne 0) {
    throw "Le rendu VFX combat a echoue pour le scenario $ScenarioName."
  }

  $captureNames = @()
  $perfCaptureNames = @()
  switch ($ScenarioName) {
    "projectile" {
      $captureNames = @("projectile-matrix", "six-projectiles-stress")
      $perfCaptureNames = @("projectile-matrix", "six-projectiles-stress")
    }
    "laser" {
      $captureNames = @("laser-matrix")
      $perfCaptureNames = @("laser-matrix")
    }
    "mixed" {
      $captureNames = @("mixed-three-projectiles-three-lasers")
      $perfCaptureNames = @("mixed-three-projectiles-three-lasers")
    }
    default { throw "Scenario VFX combat inconnu: $ScenarioName" }
  }

  if ($perfCaptureNames.Count -gt 0) {
    Ensure-Directory $PerfStateDir
    for ($offset = 0; $offset -lt $perfCaptureNames.Count; $offset += 1) {
      $captureName = $perfCaptureNames[$offset]
      $sourceState = Join-Path $ScenarioOutputDir "$captureName.json"
      if (!(Test-Path $sourceState)) {
        throw "Snapshot d'etat introuvable pour ${captureName}: $sourceState"
      }
      $perfStatePath = Join-Path $PerfStateDir ("state-{0}.json" -f ($PerfStateStartIndex + $offset))
      Copy-Item -Force $sourceState $perfStatePath
    }
  }
}

Reset-Directory $GalleryRoot
Reset-Directory $PerfStateDir

$projectileActionsPath = Join-Path $PSScriptRoot "actions\vfx-combat-projectile.json"
$laserActionsPath = Join-Path $PSScriptRoot "actions\vfx-combat-laser.json"
$mixedActionsPath = Join-Path $PSScriptRoot "actions\vfx-combat-mixed.json"

$projectileOutputDir = Join-Path $GalleryRoot "projectile"
$laserOutputDir = Join-Path $GalleryRoot "laser"
$mixedOutputDir = Join-Path $GalleryRoot "mixed"

Invoke-VfxCombatRun -ScenarioName "projectile" -ActionsPath $projectileActionsPath -TeamIds @(104, 105, 106, 107, 108, 109) -ScenarioOutputDir $projectileOutputDir -PerfStateStartIndex 0
Invoke-VfxCombatRun -ScenarioName "laser" -ActionsPath $laserActionsPath -TeamIds @(100, 101, 103, 114, 116, 121) -ScenarioOutputDir $laserOutputDir -PerfStateStartIndex 2
Invoke-VfxCombatRun -ScenarioName "mixed" -ActionsPath $mixedActionsPath -TeamIds @(104, 100, 105, 101, 106, 103) -ScenarioOutputDir $mixedOutputDir -PerfStateStartIndex 3

exit $LASTEXITCODE
