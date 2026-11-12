# Repair interrupted Node/Expo dependency installs without modifying .env, Google Sheets or Docker.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root
Write-Host "THE GOOD SIDE - REPAIR LOCAL EXPO" -ForegroundColor Cyan

# Remove stale inherited tsx preload settings only for this recovery process.
if ($env:NODE_OPTIONS -match 'tsx|preflight') {
    Write-Host "[INFO] Clearing stale NODE_OPTIONS preload for this session." -ForegroundColor Yellow
    Remove-Item Env:NODE_OPTIONS -ErrorAction SilentlyContinue
}

# Stop only Node processes whose command line refers explicitly to this project directory.
$nodeProcesses = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue)
foreach ($p in $nodeProcesses) {
    if ($p.CommandLine -and $p.CommandLine.IndexOf($root,[System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
        Write-Host ("[INFO] Stopping The Good Side Node process " + $p.ProcessId) -ForegroundColor Yellow
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw "npm.cmd is not installed or not on PATH." }
Write-Host "[INFO] Verifying locked dependencies..." -ForegroundColor Cyan
& npm.cmd ci --include=dev --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm ci failed. Do not start Expo until dependencies are installed." }

$tsxPath = Join-Path $root "node_modules\tsx\dist\preflight.cjs"
if (-not (Test-Path -LiteralPath $tsxPath)) { throw "tsx preflight still missing after npm ci. Please send the complete npm output." }

Write-Host "[OK] Dependencies repaired. Starting Expo Go..." -ForegroundColor Green
Set-Location -LiteralPath (Join-Path $root "apps\mobile")
& npx.cmd expo start --go --clear
if ($LASTEXITCODE -ne 0) { throw "Expo failed to start." }
