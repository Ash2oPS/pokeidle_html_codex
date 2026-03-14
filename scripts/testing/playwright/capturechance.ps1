$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$runnerPath = Join-Path $PSScriptRoot "invoke-web-game-playwright.ps1"
$actionsPath = Join-Path $repoRoot "output/capture_chance_actions.json"
$screenshotDir = Join-Path $repoRoot "output/web-game-capturechance"

$testAppData = Join-Path $repoRoot "tmp/pokeidle-test-appdata"
$saveDir = Join-Path $testAppData "PokeIdle"
$savePath = Join-Path $saveDir "save_main.json"
New-Item -ItemType Directory -Force -Path $saveDir | Out-Null

$nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$save = [ordered]@{
  version = 6
  starter_chosen = $true
  current_route_id = "kanto_route_1"
  unlocked_route_ids = @("kanto_city_pallet_town", "kanto_route_1")
  route_defeat_counts = @{}
  last_tick_epoch_ms = $nowMs
  team = @(4)
  pokemon_entities = @{
    "4" = [ordered]@{
      id = 4
      level = 20
      xp = 0
      entity_unlocked = $true
      encountered_normal = 1
      captured_normal = 1
    }
  }
  money = 0
  ball_inventory = [ordered]@{ poke_ball = 60; super_ball = 0; hyper_ball = 0 }
  active_ball_type = "poke_ball"
  shop_items = [ordered]@{ water_stone = 0; fire_stone = 0; leaf_stone = 0 }
  attack_boost_until_ms = 0
  pokeballs = 60
  tutorials = [ordered]@{
    route1_intro_seen = $true
    evolution_intro_seen = $false
    appearance_intro_seen = $false
    appearance_editor_unlocked = $false
  }
}
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($savePath, ($save | ConvertTo-Json -Depth 40), $utf8NoBom)
[System.IO.File]::WriteAllText($actionsPath, '{"steps":[{"buttons":[],"frames":10}]}', $utf8NoBom)

$seedQuery = [Uri]::EscapeDataString("tmp/pokeidle-test-appdata/PokeIdle/save_main.json")
$gameUrl = "http://127.0.0.1:5320/?dev_seed_save=$seedQuery"

& $runnerPath -RepoRoot $repoRoot -Port 5320 -ActionsPath $actionsPath -ScreenshotDir $screenshotDir -Iterations 90 -PauseMs 80 -GameUrl $gameUrl
exit $LASTEXITCODE
