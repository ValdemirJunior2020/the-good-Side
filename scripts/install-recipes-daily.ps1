# Run ONCE on the Windows PC hosting Ollama.
# Registers a local Windows scheduled task. Does not create a ChatGPT automation.
$ErrorActionPreference = "Stop"
$script = Join-Path $PSScriptRoot "run-recipes-daily.ps1"
if (-not (Test-Path $script)) { throw "Recipe runner missing: $script" }
$workerEnv = Join-Path (Split-Path -Parent $PSScriptRoot) "services\research-worker\.env"
if (-not (Test-Path $workerEnv)) { throw "Configure services/research-worker/.env first (do not commit secrets)." }
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument ('-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $script)
$trigger = New-ScheduledTaskTrigger -Daily -At "12:10PM"
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName "TheGoodSide-OllamaRecipes" -Action $action -Trigger $trigger -Settings $settings -Description "Use local Ollama to automatically approve up to 5 recipe drafts daily; source rights gate applies." -Force | Out-Null
Write-Host "Daily Ollama recipe task registered at 12:10 PM LOCAL PC TIME."
Write-Host "Computer and Ollama must be running. Check services/research-worker/data/recipe-autopilot.log after the first run."
