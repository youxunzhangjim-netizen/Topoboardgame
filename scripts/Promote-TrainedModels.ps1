param(
  [string]$Source = "local-models",
  [string]$Dest = "public/models"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $Source)) {
  throw "Source model folder not found: $Source"
}

New-Item -ItemType Directory -Force $Dest | Out-Null

$models = Get-ChildItem $Source -Filter "*.json" -File
if ($models.Count -eq 0) {
  Write-Host "No model JSON files found in $Source"
  exit 0
}

foreach ($m in $models) {
  Copy-Item $m.FullName (Join-Path $Dest $m.Name) -Force
  Write-Host "Promoted model: $($m.Name)"
}

Write-Host ""
Write-Host "Promoted $($models.Count) model(s) to $Dest"
Write-Host "Next: test website/local app robot model loading before committing."
