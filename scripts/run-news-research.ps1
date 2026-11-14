# Run the Ollama news worker directly, without nested npm processes.
# Logs each invocation and preserves exit codes for Windows Task Scheduler.
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$worker = Join-Path $root "services\research-worker"
$data = Join-Path $worker "data"
New-Item -ItemType Directory -Force -Path $data | Out-Null
$log = Join-Path $data "news-autopilot.log"
$node = (Get-Command node.exe -ErrorAction Stop).Source
$tsx = Join-Path $root "node_modules\tsx\dist\cli.mjs"
$script = Join-Path $worker "src\index.ts"
if (!(Test-Path $tsx) -or !(Test-Path $script)) { throw "Research worker dependencies not installed. Run npm install at repo root." }
Add-Content -Path $log -Value ("----- " + (Get-Date).ToString("o") + " news run start; user=" + $env:USERNAME + "; PID=" + $PID + " -----")
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 10
    if ($null -eq $health.models) { throw "Ollama is not responding with a model list." }
    Push-Location $worker
    try {
        # Run the worker without npm's additional cmd.exe/node process tree.
        # Native stderr lines are diagnostics, not PowerShell terminating errors.
        $ErrorActionPreference = "Continue"
        & $node $tsx $script *>> $log
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = "Stop"
        Pop-Location
    }
    if ($code -ne 0) { throw "News worker exited with code $code" }
    Add-Content -Path $log -Value ("----- " + (Get-Date).ToString("o") + " news run completed successfully -----")
} catch {
    Add-Content -Path $log -Value ("----- " + (Get-Date).ToString("o") + " news run failed: " + $_.Exception.Message + " -----")
    exit 1
}
