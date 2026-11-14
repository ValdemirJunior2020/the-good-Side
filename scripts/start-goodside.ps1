# The Good Side — safe one-click local start.
# Only operates on Ollama, existing AIHOT containers, local API and local Admin.
# Never rebuilds, stops or removes unrelated Docker containers.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $root "logs"
New-Item -ItemType Directory -Path $logs -Force | Out-Null
$errors = 0

function Info([string]$msg) { Write-Host ("[INFO] " + $msg) -ForegroundColor Cyan }
function OK([string]$msg) { Write-Host ("[OK] " + $msg) -ForegroundColor Green }
function Warn([string]$msg) { Write-Host ("[WARN] " + $msg) -ForegroundColor Yellow }
function Is-HttpHealthy([string]$url) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 8
        return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300)
    } catch { return $false }
}
# Vite defaults to localhost and may listen on IPv6 rather than 127.0.0.1.
function Is-AdminHealthy {
    return ((Is-HttpHealthy "http://localhost:5173/") -or (Is-HttpHealthy "http://127.0.0.1:5173/"))
}
function Wait-For([scriptblock]$check,[int]$seconds) {
    $until = (Get-Date).AddSeconds($seconds)
    do {
        try { if (& $check) { return $true } } catch {}
        Start-Sleep -Seconds 3
    } while ((Get-Date) -lt $until)
    try { return [bool](& $check) } catch { return $false }
}
function Docker-Ready {
    try {
        $version = & docker version --format '{{.Server.Version}}' 2>$null
        return ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($version -join "")))
    } catch { return $false }
}
function Start-Runner([string]$name,[string]$relativeScript) {
    $file = Join-Path $root $relativeScript
    $exe = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
    $args = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "{0}"' -f $file
    Start-Process -FilePath $exe -ArgumentList $args -WorkingDirectory $root -WindowStyle Hidden | Out-Null
    Info ("Started " + $name + " in the background.")
}

Info ("Project: " + $root)

# Ollama may already be running as a Windows tray service.
if (Is-HttpHealthy "http://127.0.0.1:11434/api/tags") {
    OK "Ollama already running."
} else {
    $ollama = Get-Command ollama.exe -ErrorAction SilentlyContinue
    if ($null -eq $ollama) { Warn "Ollama executable not found in PATH."; $errors++ }
    else {
        Info "Starting Ollama..."
        try {
            Start-Process -FilePath $ollama.Source -ArgumentList "serve" -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logs "ollama-stdout.log") -RedirectStandardError (Join-Path $logs "ollama-stderr.log") | Out-Null
        } catch { Warn ("Unable to launch Ollama: " + $_.Exception.Message) }
        if (Wait-For { Is-HttpHealthy "http://127.0.0.1:11434/api/tags" } 50) {
            OK "Ollama ready on port 11434."
        } else { Warn "Ollama not healthy. See logs\ollama-stderr.log."; $errors++ }
    }
}

# Docker Desktop and only four AIHOT project containers.
$docker = Get-Command docker.exe -ErrorAction SilentlyContinue
if ($null -eq $docker) {
    Warn "Docker CLI not found in PATH. Install or open Docker Desktop."
    $errors++
} else {
    if (-not (Docker-Ready)) {
        $desktop = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
        if (Test-Path -LiteralPath $desktop) {
            Info "Starting Docker Desktop..."
            try { Start-Process -FilePath $desktop | Out-Null } catch { Warn ("Docker Desktop launch failed: " + $_.Exception.Message) }
        } else { Warn "Docker Desktop is not in the standard installation folder." }
    }
    if (Wait-For { Docker-Ready } 120) {
        OK "Docker engine ready."
        $names = @("aihot-db-1","aihot-api-1","aihot-worker-1","aihot-web-1")
        $existing = @(& docker ps -a --format '{{.Names}}')
        $missing = @($names | Where-Object { $existing -notcontains $_ })
        if ($missing.Count -gt 0) {
            Warn ("Missing AIHOT containers: " + ($missing -join ", "))
            Warn "AIHOT must first be initialized separately. No automatic rebuild will be attempted."
            $errors++
        } else {
            $running = @(& docker ps --format '{{.Names}}')
            foreach ($name in $names) {
                if ($running -contains $name) { OK ($name + " already running.") }
                else {
                    Info ("Starting " + $name)
                    & docker start $name | Out-Null
                    if ($LASTEXITCODE -ne 0) { Warn ("Could not start " + $name); $errors++ }
                }
            }
        }
        if (Wait-For { Is-HttpHealthy "http://127.0.0.1:3000/api/v1/items?mode=selected&window=7d&limit=1" } 90) {
            OK "AIHOT selected-news API ready on port 3000."
        } else { Warn "AIHOT API not responding on localhost:3000. Check docker logs aihot-web-1."; $errors++ }
    } else { Warn "Docker engine did not become available."; $errors++ }
}

# Local fallback/dev API. When Render exists, it stays online independently.
if (Is-HttpHealthy "http://127.0.0.1:8788/health") {
    OK "Local The Good Side API already running."
} elseif (-not (Test-Path -LiteralPath (Join-Path $root "services\api\.env"))) {
    Warn "Local API .env missing; skipping optional local API."
} elseif (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    Warn "npm.cmd not found: cannot start local Node API."
    $errors++
} else {
    Start-Runner "local Node API" "scripts\run-local-api.ps1"
    if (Wait-For { Is-HttpHealthy "http://127.0.0.1:8788/health" } 35) {
        OK "Local API ready on port 8788."
    } else { Warn "Local API not ready; check logs\goodside-local-api.log."; $errors++ }
}

if (Is-AdminHealthy) {
    OK "Local Admin already running."
} elseif (-not (Test-Path -LiteralPath (Join-Path $root "apps\admin\.env"))) {
    Warn "Admin .env missing; skipping optional local Admin."
} elseif (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    Warn "npm.cmd not found: cannot start local Admin."
    $errors++
} else {
    Start-Runner "local Admin" "scripts\run-local-admin.ps1"
    if (Wait-For { Is-AdminHealthy } 35) {
        OK "Admin ready at http://localhost:5173."
     } else {
        Warn "Admin not ready; check logs\goodside-local-admin.log."
        $adminLog = Join-Path $logs "goodside-local-admin.log"
        if (Test-Path -LiteralPath $adminLog) {
            Warn "Recent Admin startup log:"
            Get-Content -LiteralPath $adminLog -Tail 12 | ForEach-Object { Write-Host ("    " + $_) }
        }
        $errors++
    }
}

# Keep the existing 30-minute Task Scheduler registration. Never duplicate it.
try {
    $task = Get-ScheduledTask -TaskName "TheGoodSide-AutoNews" -ErrorAction Stop
    $taskInfo = Get-ScheduledTaskInfo -TaskName "TheGoodSide-AutoNews"
    OK ("TheGoodSide-AutoNews task exists; state=" + $task.State + "; next=" + $taskInfo.NextRunTime)
    if ($task.State -eq "Ready" -and
        (Is-HttpHealthy "http://127.0.0.1:11434/api/tags") -and
        (Is-HttpHealthy "http://127.0.0.1:3000/api/v1/items?mode=selected&window=7d&limit=1")) {
        Start-ScheduledTask -TaskName "TheGoodSide-AutoNews" -ErrorAction Stop
        Info "Requested one immediate import. Future imports stay on the existing 30-minute schedule."
    } else { Warn "Immediate import skipped: task or AI is not ready." }
} catch { Warn ("Scheduled task not available: " + $_.Exception.Message); $errors++ }

Write-Host ""
if ($errors -eq 0) {
    OK "Local startup complete. No unrelated Docker project changed."
} else {
    Warn ("Startup finished with " + $errors + " warning(s).")
}
Info "Once Render is deployed, update only services\research-worker\.env API_URL to its HTTPS URL."
Info "Render and Netlify are independent of this BAT."
if ($errors -gt 0) { exit 1 }
exit 0
