param(
  [int]$WaitFor3DPid = 6220,
  [string]$Remote = "origin",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force local-data/logs | Out-Null
$log = "local-data/logs/wait-push-train2d-push-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

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
  Invoke-Checked git @("add", "public/models", "scripts/Train-3DVariants100.ps1", "scripts/Run-3DVariants100.cmd", "scripts/Train-2DVariants100.ps1", "scripts/Run-2DVariants100.cmd", "scripts/Wait-Push-Train2D-Push.ps1")
  $status = (& git status --short)
  if (-not $status) {
    Write-Log "No git changes to commit for: $Message"
    return
  }
  Invoke-Checked git @("commit", "-m", $Message)
  Invoke-Checked git @("push", $Remote, $Branch)
}

try {
  Write-Log "Queue started. Waiting for 3D training PID $WaitFor3DPid if it is still running."
  if ($WaitFor3DPid -gt 0 -and (Get-Process -Id $WaitFor3DPid -ErrorAction SilentlyContinue)) {
    Wait-Process -Id $WaitFor3DPid
  }

  Assert-TrainingFinished "train-3d-variants-100-*.out.log" "Finished 3D robot training"
  Commit-And-Push "Train 3D robot models"

  Write-Log "Starting 2D robot training after 3D push."
  Invoke-Checked powershell.exe @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "scripts/Train-2DVariants100.ps1", "-Games", "100", "-Epochs", "8")

  Assert-TrainingFinished "train-2d-variants-100-*.out.log" "Finished 2D robot training"
  Commit-And-Push "Train 2D robot models"

  Write-Log "Queue finished successfully."
} catch {
  Write-Log "Queue failed: $($_.Exception.Message)"
  throw
}
