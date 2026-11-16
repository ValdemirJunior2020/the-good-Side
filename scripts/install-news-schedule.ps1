# Install a 6-hourly news research job for the current signed-in Windows user.
# Only runs when the user is logged in; can run while the computer stays awake.
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runner = Join-Path $PSScriptRoot "run-news-research.ps1"
if (!(Test-Path $runner)) { throw "News runner script not found: $runner" }
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument ("-NoProfile -ExecutionPolicy Bypass -File `"" + $runner + "`"") -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(3) -RepetitionInterval (New-TimeSpan -Hours 6)
$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 5)
Register-ScheduledTask -TaskName "TheGoodSide-OllamaNews" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Research licensed NASA news with local Ollama every six hours" -Force | Out-Null
Write-Host "Task created: TheGoodSide-OllamaNews (every 6 hours while signed in)"
Write-Host ("Run log: " + (Join-Path $root "services\research-worker\data\news-autopilot.log"))
