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
    & npm.cmd run dev -w @goodside/admin *>> (Join-Path $logs "goodside-local-admin.log")
} catch {
    Add-Content -LiteralPath (Join-Path $logs "goodside-local-admin.log") -Value ("Startup error: " + $_.Exception.Message)
} finally {
    if ($held) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
