# Pull the verified Good Side branch without overwriting local work or .env secrets.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\pull-good-side.ps1
$ErrorActionPreference = "Stop"
$root = "C:\Users\nobody\Desktop\the-good-Side"
$branch = "feature/hybrid-render-local-ai"
if (-not (Test-Path (Join-Path $root ".git"))) { throw "Not a Git repository: $root" }
Push-Location $root
try {
    $changes = @(git status --porcelain --untracked-files=no)
    if ($LASTEXITCODE -ne 0) { throw "Could not inspect Git status" }
    if ($changes.Count -gt 0) {
        Write-Warning "Local tracked files have changes. Nothing was pulled."
        git status --short
        throw "Commit or stash local changes yourself, then rerun. This script will not discard work."
    }
    git fetch origin $branch
    if ($LASTEXITCODE -ne 0) { throw "Unable to fetch $branch" }
    git show-ref --verify --quiet ("refs/heads/" + $branch)
    if ($LASTEXITCODE -eq 0) {
        git switch $branch
    } else {
        git switch --track -c $branch ("origin/" + $branch)
    }
    if ($LASTEXITCODE -ne 0) { throw "Branch switch failed; local files were not overwritten" }
    git pull --ff-only origin $branch
    if ($LASTEXITCODE -ne 0) { throw "Fast-forward pull was not possible; nothing force-reset" }
    Write-Host "The Good Side code is synchronized." -ForegroundColor Green
    Write-Host "Your local .env files were not changed."
    Write-Host "Check apps/mobile/.env: EXPO_PUBLIC_API_URL=https://the-good-side-api.onrender.com"
    Write-Host "Do not put Supabase secret/service-role keys in mobile .env."
    Write-Host "Run npm ci if dependencies have changed, then npm run mobile"
} finally {
    Pop-Location
}
