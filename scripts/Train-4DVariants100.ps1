param(
  [int]$Games = 100,
  [int]$Epochs = 8,
  [int]$Depth = 1,
  [int]$MaxPlies = 32,
  [switch]$SkipPromote
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force local-data/selfplay | Out-Null
New-Item -ItemType Directory -Force local-data/logs | Out-Null
New-Item -ItemType Directory -Force local-models | Out-Null
New-Item -ItemType Directory -Force public/models | Out-Null

$runStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$log = "local-data/logs/train-4d-variants-100-$runStamp.out.log"
$err = "local-data/logs/train-4d-variants-100-$runStamp.err.log"

function Write-Log($Message) {
  $line = "[$(Get-Date -Format o)] $Message"
  Add-Content -Path $log -Value $line
  Write-Host $line
}

function Invoke-Native($ScriptBlock) {
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    # Research scripts report progress on stderr; judge native success by exit code.
    $script:ErrorActionPreference = "Continue"
    & $ScriptBlock
  } finally {
    $script:ErrorActionPreference = $previousErrorActionPreference
  }
}

function Add-Job($Jobs, $Game, $Boundary, $Lattice, $Size, $DepthOverride = $null, $EpochOverride = $null, $MaxPliesOverride = $null) {
  $Jobs.Add([ordered]@{
    Game = $Game
    Boundary = $Boundary
    Lattice = $Lattice
    Size = $Size
    Depth = if ($null -ne $DepthOverride) { $DepthOverride } else { $Depth }
    Epochs = if ($null -ne $EpochOverride) { $EpochOverride } else { $Epochs }
    MaxPlies = if ($null -ne $MaxPliesOverride) { $MaxPliesOverride } else { $MaxPlies }
  }) | Out-Null
}

$jobs = New-Object System.Collections.Generic.List[object]

# Current headless self-play supports 4D Jump and 4D Hex. 4D Go/Reversi UI
# exists, but those games do not yet expose research/selfplay adapters.
foreach ($boundary in @("hypercube", "cylinder", "4d-torus", "cube", "projection")) {
  Add-Job $jobs "4djump" $boundary "jump4d" 3 1 8 24
}

foreach ($boundary in @("open", "torus")) {
  Add-Job $jobs "4dhex" $boundary "axis" 4 1 8 64
}

Write-Log "Started 4D robot training: $($jobs.Count) variants, $Games games each."
Write-Log "Output log: $log"
Write-Log "Error/progress log: $err"

$completed = 0
try {
  foreach ($job in $jobs) {
    $stem = "$($job.Game)-$($job.Boundary)-$($job.Lattice)-s$($job.Size)-100"
    $data = "local-data/selfplay/$stem.jsonl"
    $model = "local-models/$stem-linear.json"

    Write-Log "Self-play: $stem"
    Invoke-Native {
      & npm.cmd run research:selfplay -- `
        --game $job.Game `
        --boundary $job.Boundary `
        --lattice $job.Lattice `
        --size $job.Size `
        --games $Games `
        --maxPlies $job.MaxPlies `
        --depthA $job.Depth `
        --depthB $job.Depth `
        --record moves `
        --state true `
        --out $data 2>> $err
    }
    if ($LASTEXITCODE -ne 0) { throw "Self-play failed for $stem" }

    Write-Log "Train: $model"
    Invoke-Native {
      & npm.cmd run ml:train-linear -- `
        --in $data `
        --out $model `
        --epochs $job.Epochs `
        --lr 0.04 `
        --l2 0.0005 `
        --game $job.Game 2>> $err
    }
    if ($LASTEXITCODE -ne 0) { throw "Training failed for $stem" }

    $completed += 1
    Write-Log "Finished variant $completed/$($jobs.Count): $stem"
  }

  if (-not $SkipPromote) {
    Write-Log "Promoting local-models/*.json to public/models."
    Invoke-Native {
      & powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/Promote-TrainedModels.ps1 2>> $err
    }
    if ($LASTEXITCODE -ne 0) { throw "Model promotion failed" }
  }

  Write-Log "Finished 4D robot training: $completed/$($jobs.Count) variants."
} catch {
  Add-Content -Path $err -Value "[$(Get-Date -Format o)] $($_.Exception.Message)"
  Write-Log "Stopped after $completed/$($jobs.Count) variants because of an error. See $err"
  throw
}
