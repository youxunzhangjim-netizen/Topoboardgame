param(
  [switch]$SkipBuild,
  [switch]$SkipDesktop
)

$ErrorActionPreference = "Stop"

function Run-Step($Name, $Command) {
  Write-Host ""
  Write-Host "== $Name ==" -ForegroundColor Cyan
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $Name"
  }
}

Run-Step "Check npm" "npm --version"
Run-Step "Verify local robots" "npm run verify:local-robots"
Run-Step "Verify research" "npm run verify:research"
Run-Step "Verify ML" "npm run verify:ml"

if (-not $SkipBuild) {
  Run-Step "Build web app" "npm run build"
}

if (-not $SkipDesktop) {
  Run-Step "Electron directory build" "npm run desktop:dir"
}

Write-Host ""
Write-Host "Preupload check finished." -ForegroundColor Green
Write-Host "Remember: do not commit local-data/selfplay/*.jsonl, node_modules, dist, or raw logs."
