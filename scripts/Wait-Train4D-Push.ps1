param(
  [int]$WaitForQueuePid = 16784,
  [string]$Remote = "origin",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force local-data/logs | Out-Null
$log = "local-data/logs/wait-train4d-push-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log($Message) {
  $line = "[$(Get-Date -Format o)] $Message"
  Add-Content -Path $log -Value $line
  Write-Host $line
}

function Invoke-Checked($Command, $Args) {
  Write-Log "Run: $Command $($Args -join ' ')"
  & $Command @Args
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $Command $($Args -join ' ')"
  }
}

function Assert-TrainingFinished($Pattern, $Needle) {
  $latest = Get-ChildItem -LiteralPath local-data/logs -Filter $Pattern -File |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (-not $latest) { throw "Could not find training log matching $Pattern" }
  Write-Log "Checking training log: $($latest.FullName)"
  $content = Get-Content -LiteralPath $latest.FullName -Raw
  if ($content -notmatch [regex]::Escape($Needle)) {
    throw "Training did not finish cleanly. Missing marker: $Needle"
  }
}

function Commit-And-Push($Message) {
  Invoke-Checked git @("add", "public/models", "scripts/Train-4DVariants100.ps1", "scripts/Run-4DVariants100.cmd", "scripts/Wait-Train4D-Push.ps1")
  $status = (& git status --short)
  if (-not $status) {
    Write-Log "No git changes to commit for: $Message"
    return
  }
  Invoke-Checked git @("commit", "-m", $Message)
  Invoke-Checked git @("push", $Remote, $Branch)
}

try {
  Write-Log "4D follow-on queue started. Waiting for previous queue PID $WaitForQueuePid if it is still running."
  if ($WaitForQueuePid -gt 0 -and (Get-Process -Id $WaitForQueuePid -ErrorAction SilentlyContinue)) {
    Wait-Process -Id $WaitForQueuePid
  }

  Write-Log "Starting 4D robot training after 2D queue."
  Invoke-Checked powershell.exe @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "scripts/Train-4DVariants100.ps1", "-Games", "100", "-Epochs", "8")

  Assert-TrainingFinished "train-4d-variants-100-*.out.log" "Finished 4D robot training"
  Commit-And-Push "Train 4D robot models"

  Write-Log "4D follow-on queue finished successfully."
} catch {
  Write-Log "4D follow-on queue failed: $($_.Exception.Message)"
  throw
}
