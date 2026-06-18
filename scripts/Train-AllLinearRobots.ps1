param(
  [ValidateSet("quick", "normal", "large")][string]$Preset = "quick",
  [switch]$SkipEval,
  [int]$MaxJobs = 0
)

$ErrorActionPreference = "Stop"
$npmArgs = @("run", "ml:train-all", "--", "--preset", $Preset)
if ($SkipEval) { $npmArgs += @("--skipEval", "true") }
if ($MaxJobs -gt 0) { $npmArgs += @("--maxJobs", [string]$MaxJobs) }

Write-Host "Running Topoboardgame all-mode robot training via npm $($npmArgs -join ' ')"
Write-Host "Evaluation tournaments run by default. Use -SkipEval only for train-only debug runs."
npm @npmArgs
