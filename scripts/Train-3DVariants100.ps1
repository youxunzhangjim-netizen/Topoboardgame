param(
  [int]$Games = 100,
  [int]$Epochs = 8,
  [int]$Depth = 1,
  [int]$MaxPlies = 220,
  [switch]$SkipPromote
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force local-data/selfplay | Out-Null
New-Item -ItemType Directory -Force local-data/logs | Out-Null
New-Item -ItemType Directory -Force local-models | Out-Null
New-Item -ItemType Directory -Force public/models | Out-Null

$runStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$log = "local-data/logs/train-3d-variants-100-$runStamp.out.log"
$err = "local-data/logs/train-3d-variants-100-$runStamp.err.log"

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

# 3D Chess: current headless 3D chess spaces.
foreach ($boundary in @("r3", "t3", "reflection", "r3_random", "t2", "sphere", "mobius", "rp2")) {
  Add-Job $jobs "3dchess" $boundary "chess3d" 8 1 8 180
}

# 3D Go volume boards: R3/T3/RBC with cubic-family lattices.
foreach ($boundary in @("r3", "t3", "r3_random")) {
  foreach ($lattice in @("sc", "bcc", "fcc", "hcp")) {
    Add-Job $jobs "3dgo" $boundary $lattice 5 1 8
  }
}

# 3D Go surface boards: train stable vertex/surface variants. Klein is skipped here
# because Steam stabilization treats it as a separately validated vertex board.
foreach ($boundary in @("t2", "cylinder", "mobius")) {
  foreach ($lattice in @("square", "honeycomb", "triangular")) {
    Add-Job $jobs "3dgo" $boundary $lattice 8 1 8
  }
}
foreach ($lattice in @("sphere_coordinate", "buckyball")) {
  Add-Job $jobs "3dgo" "sphere" $lattice 8 1 8
}

# 3D Reversi volume boards: standard, periodic, random, and RP3 with straight-line lattices.
foreach ($boundary in @("r3", "t3", "r3_random", "rp3")) {
  foreach ($lattice in @("square", "bcc", "fcc")) {
    Add-Job $jobs "3dreversi" $boundary $lattice 6 2 8
  }
}

# 3D Reversi surface boards where the headless logic is stable.
foreach ($boundary in @("t2", "cylinder", "mobius", "klein")) {
  foreach ($lattice in @("square", "honeycomb")) {
    Add-Job $jobs "3dreversi" $boundary $lattice 8 2 8
  }
}
Add-Job $jobs "3dreversi" "sphere" "square" 8 2 8 220

# 3D Jump boards.
foreach ($boundary in @("cube", "cylinder", "torus", "sphere")) {
  Add-Job $jobs "3djump" $boundary "jump3d" 6 1 8 180
}

# 3D Hex volume and surface boards. Trefoil is deliberately omitted from this
# release training batch because its gameplay target zones are still specialized.
foreach ($boundary in @("open", "torus", "r3_random")) {
  foreach ($lattice in @("axis", "bcc", "fcc", "hcp")) {
    Add-Job $jobs "3dhex" $boundary $lattice 5 2 8
  }
}
foreach ($boundary in @("t2", "cylinder", "mobius", "klein")) {
  foreach ($lattice in @("square", "honeycomb", "triangular")) {
    Add-Job $jobs "3dhex" $boundary $lattice 8 2 8
  }
}
foreach ($lattice in @("sphere_coordinate", "buckyball")) {
  Add-Job $jobs "3dhex" "sphere" $lattice 8 2 8
}

Write-Log "Started 3D robot training: $($jobs.Count) variants, $Games games each."
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

  Write-Log "Finished 3D robot training: $completed/$($jobs.Count) variants."
} catch {
  Add-Content -Path $err -Value "[$(Get-Date -Format o)] $($_.Exception.Message)"
  Write-Log "Stopped after $completed/$($jobs.Count) variants because of an error. See $err"
  throw
}
