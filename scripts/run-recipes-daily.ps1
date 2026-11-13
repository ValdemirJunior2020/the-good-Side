# The Good Side — daily Ollama recipe auto-editor.
# Starts locally, uses worker/.env, and never puts private keys into GitHub.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$worker = Join-Path $root "services\research-worker"
$envFile = Join-Path $worker ".env"
if (-not (Test-Path $envFile)) {
  Write-Error "Missing services/research-worker/.env. Copy .env.example and configure Ollama/worker settings before scheduling."
  exit 1
}
New-Item -ItemType Directory -Force (Join-Path $worker "data") | Out-Null
$log = Join-Path $worker "data\recipe-autopilot.log"
Push-Location $worker
try {
  $env:DOTENV_CONFIG_PATH = $envFile
  Add-Content -Path $log -Value "----- $(Get-Date -Format o): starting recipe editor -----"
  & npm.cmd run recipes:discover *>> $log
  if ($LASTEXITCODE -ne 0) { throw "Recipe worker exited with code $LASTEXITCODE" }
  Write-Host "Recipe worker completed. Log: $log"
} finally { Pop-Location }
