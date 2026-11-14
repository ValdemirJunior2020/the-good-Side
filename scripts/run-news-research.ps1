# Runs the existing Ollama-powered approved-source news worker.
# Requires Ollama, the configured worker secret, and a reachable API gateway.
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$data = Join-Path $root "services\research-worker\data"
New-Item -ItemType Directory -Force -Path $data | Out-Null
$log = Join-Path $data "news-autopilot.log"
Add-Content -Path $log -Value ("----- " + (Get-Date).ToString("o") + " news run start -----")
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 10
    if ($null -eq $health.models) { throw "Ollama response did not contain a model list." }
    Push-Location $root
    try {
        & npm.cmd run research *>> $log
        $code = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    if ($code -ne 0) { throw "News research process exited with code $code." }
    Add-Content -Path $log -Value ("----- " + (Get-Date).ToString("o") + " news run completed -----")
} catch {
    Add-Content -Path $log -Value ("----- " + (Get-Date).ToString("o") + " news run failed: " + $_.Exception.Message + " -----")
    exit 1
}
