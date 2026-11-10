Set-Location "C:\Users\nobody\Desktop\the-good-Side"

$log = "C:\Users\nobody\Desktop\the-good-Side\goodside-import.log"
Add-Content $log "`n=== Import started: $(Get-Date) ==="

npm run aihot:import *>> $log

Add-Content $log "=== Import finished: $(Get-Date) | Exit: $LASTEXITCODE ==="
