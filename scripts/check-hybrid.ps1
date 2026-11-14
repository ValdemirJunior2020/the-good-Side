param([string]$RenderApiUrl = "")
$ErrorActionPreference = "Continue"
function Check($label,$url) {
  try {
    $response = Invoke-RestMethod -Uri $url -TimeoutSec 12
    Write-Host ("[OK] {0}: {1}" -f $label, $url) -ForegroundColor Green
    if ($label -eq "Render health") { Write-Host ("Status: {0}" -f $response.status) }
  } catch { Write-Host ("[FAIL] {0}: {1}" -f $label, $_.Exception.Message) -ForegroundColor Yellow }
}
Write-Host "THE GOOD SIDE HYBRID SYSTEM CHECK"
Check "Local Ollama" "http://127.0.0.1:11434/api/tags"
Check "Local AIHOT" "http://127.0.0.1:3000/api/v1/items?mode=selected&window=7d&limit=1"
if ($RenderApiUrl) {
  $base = $RenderApiUrl.TrimEnd("/")
  Check "Render health" ($base + "/health")
  Check "Render news" ($base + "/news?limit=1")
  Check "Render recipes" ($base + "/recipes")
} else { Write-Host "Render URL not provided; only local research services checked." }
try {
  $task = Get-ScheduledTask -TaskName "TheGoodSide-AutoNews" -ErrorAction Stop
  $info = Get-ScheduledTaskInfo -TaskName "TheGoodSide-AutoNews"
  Write-Host ("[TASK] {0} | State {1} | Last {2} | Next {3}" -f $task.TaskName, $task.State, $info.LastRunTime, $info.NextRunTime)
} catch { Write-Host "[TASK] Existing 30-minute importer task not found; create it using Windows Task Scheduler." -ForegroundColor Yellow }
