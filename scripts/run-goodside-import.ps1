# Local AIHOT + Ollama importer; retain the existing 30-minute Windows Scheduled Task.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$log = Join-Path $root "goodside-import.log"
$mutex = New-Object System.Threading.Mutex($false, "Local\TheGoodSide-AIHOT-Import")
$locked = $false
try {
  $locked = $mutex.WaitOne(0)
  if (-not $locked) { Add-Content -LiteralPath $log -Value "Skipping overlapping importer run"; return }
  Push-Location -LiteralPath $root
  try {
    Add-Content -LiteralPath $log -Value ("Import start: {0}" -f (Get-Date -Format o))
    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw "npm.cmd missing from PATH" }
    & npm.cmd run aihot:import *>> $log
    $exitCode = $LASTEXITCODE
    Add-Content -LiteralPath $log -Value ("Import finished: {0}; exit={1}" -f (Get-Date -Format o), $exitCode)
  } finally { Pop-Location }
} catch {
  Add-Content -LiteralPath $log -Value ("Importer ERROR: {0}" -f $_.Exception.Message)
  throw
} finally {
  if ($locked) { $mutex.ReleaseMutex() }
  $mutex.Dispose()
}
