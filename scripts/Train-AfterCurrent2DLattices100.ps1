param(
  [int]$WaitForPid = 37424,
  [int]$Games = 100,
  [int]$Epochs = 8
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force local-data/selfplay | Out-Null
New-Item -ItemType Directory -Force local-data/logs | Out-Null
New-Item -ItemType Directory -Force local-models | Out-Null
New-Item -ItemType Directory -Force public/models | Out-Null

$log = "local-data/logs/train-after-current-2d-lattices-100.out.log"
$err = "local-data/logs/train-after-current-2d-lattices-100.err.log"

function Write-Log($Message) {
  $line = "[$(Get-Date -Format o)] $Message"
  Add-Content -Path $log -Value $line
  Write-Host $line
}

try {
  if ($WaitForPid -gt 0 -and (Get-Process -Id $WaitForPid -ErrorAction SilentlyContinue)) {
    Write-Log "Waiting for existing training PID $WaitForPid to finish."
    Wait-Process -Id $WaitForPid
  }

  $jobs = @(
    @{ Game = "2dgo"; Boundary = "pbc"; Lattice = "triangular"; Size = 9; Depth = 1 },
    @{ Game = "2dgo"; Boundary = "pbc"; Lattice = "honeycomb"; Size = 9; Depth = 1 },
    @{ Game = "2dreversi"; Boundary = "pbc"; Lattice = "honeycomb"; Size = 8; Depth = 2 }
  )

  foreach ($job in $jobs) {
    $stem = "$($job.Game)-$($job.Boundary)-$($job.Lattice)-s$($job.Size)-100"
    $data = "local-data/selfplay/$stem.jsonl"
    $model = "local-models/$stem-linear.json"

    Write-Log "Self-play: $stem"
    & npm.cmd run research:selfplay -- `
      --game $job.Game `
      --boundary $job.Boundary `
      --lattice $job.Lattice `
      --size $job.Size `
      --games $Games `
      --depthA $job.Depth `
      --depthB $job.Depth `
      --record moves `
      --state true `
      --out $data 2>> $err
    if ($LASTEXITCODE -ne 0) { throw "Self-play failed for $stem" }

    Write-Log "Train: $model"
    & npm.cmd run ml:train-linear -- `
      --in $data `
      --out $model `
      --epochs $Epochs `
      --lr 0.04 `
      --l2 0.0005 `
      --game $job.Game 2>> $err
    if ($LASTEXITCODE -ne 0) { throw "Training failed for $stem" }
  }

  Write-Log "Promoting local-models/*.json to public/models."
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Promote-TrainedModels.ps1 2>> $err
  if ($LASTEXITCODE -ne 0) { throw "Model promotion failed" }

  Write-Log "Finished queued 2D lattice 100-game training."
} catch {
  Add-Content -Path $err -Value "[$(Get-Date -Format o)] $($_.Exception.Message)"
  throw
}
