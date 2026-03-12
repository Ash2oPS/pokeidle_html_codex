$ErrorActionPreference = "Stop"

$port = 5320
$repoRoot = $PSScriptRoot
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
$clientPath = Join-Path $codexHome "skills/develop-web-game/scripts/web_game_playwright_client.js"
$actionsPath = Join-Path $repoRoot "output/capture_chance_actions.json"
$screenshotDir = Join-Path $repoRoot "output/web-game-capturechance"

if (!(Test-Path $clientPath)) {
  throw "Client Playwright introuvable: $clientPath"
}

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

$server = Start-Process -FilePath py -ArgumentList @("-3", "-m", "http.server", "$port", "--bind", "127.0.0.1") -WorkingDirectory $repoRoot -PassThru
$serverReady = $false
for ($i = 0; $i -lt 80; $i++) {
  Start-Sleep -Milliseconds 250
  try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:$port" -Method GET -TimeoutSec 2
    $serverReady = $true
    break
  } catch {}
}

if (-not $serverReady) {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  throw "Le serveur statique n'a pas demarre correctement sur le port $port."
}

$seedQuery = [Uri]::EscapeDataString("tmp/pokeidle-test-appdata/PokeIdle/save_main.json")
$gameUrl = "http://127.0.0.1:$port/?dev_seed_save=$seedQuery"

try {
  node $clientPath --url $gameUrl --actions-file $actionsPath --iterations 90 --pause-ms 80 --screenshot-dir $screenshotDir
  exit $LASTEXITCODE
}
finally {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
