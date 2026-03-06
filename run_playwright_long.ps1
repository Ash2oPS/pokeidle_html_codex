$ErrorActionPreference = "Stop"
$port = 5318
$server = Start-Process -FilePath py -ArgumentList '-3','-m','http.server',$port -WorkingDirectory 'C:/Users/etiennes/Desktop/Perso/pokeidle_html_codex' -PassThru
Start-Sleep -Seconds 2
try {
  node "C:/Users/etiennes/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js" --url "http://127.0.0.1:$port" --actions-file "output/long_actions.json" --iterations 1 --pause-ms 0 --screenshot-dir "output/web-game-long"
  exit $LASTEXITCODE
}
finally {
  Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
}
