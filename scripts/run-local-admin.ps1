# Hidden local development runner: keeps one instance alive.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $root "logs"
New-Item -Path $logs -ItemType Directory -Force | Out-Null
$mutex = New-Object System.Threading.Mutex($false, "Local\TheGoodSide-Admin")
$held = $false
try {
    try { $held = $mutex.WaitOne(0) }
    catch [System.Threading.AbandonedMutexException] { $held = $true }
    if (-not $held) { exit 0 }
    Set-Location -LiteralPath $root
    # Use an explicit port and host; do not silently jump to port 5174.
    & npm.cmd run dev -w @goodside/admin -- --host 127.0.0.1 --port 5173 --strictPort *>> (Join-Path $logs "goodside-local-admin.log")
} catch {
    Add-Content -LiteralPath (Join-Path $logs "goodside-local-admin.log") -Value ("Startup error: " + $_.Exception.Message)
} finally {
    if ($held) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
