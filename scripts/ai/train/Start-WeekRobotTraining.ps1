param(
  [int]$DurationHours = 168,
  [int]$StandardTeacherGames = 1000,
  [int]$VariantGames = 100,
  [string]$Remote = "origin",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$Repo = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LogDir = Join-Path $Repo "local-data\training\week-robot-training\$Stamp"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$StdOut = Join-Path $LogDir "stdout.log"
$StdErr = Join-Path $LogDir "stderr.log"

$Args = @(
  "scripts/ai/train/weekRobotTraining.mjs",
  "--durationHours", "$DurationHours",
  "--standardTeacherGames", "$StandardTeacherGames",
  "--variantGames", "$VariantGames",
  "--remote", $Remote,
  "--branch", $Branch,
  "--logDir", "local-data/training/week-robot-training/$Stamp"
)

$Process = Start-Process -FilePath "node" `
  -ArgumentList $Args `
  -WorkingDirectory $Repo `
  -RedirectStandardOutput $StdOut `
  -RedirectStandardError $StdErr `
  -WindowStyle Hidden `
  -PassThru

Write-Host "Started quiet week robot training."
Write-Host "PID: $($Process.Id)"
Write-Host "Log folder: $LogDir"
