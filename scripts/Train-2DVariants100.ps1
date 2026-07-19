param(
  [int]$Games = 100,
  [int]$Epochs = 8,
  [int]$Depth = 1,
  [int]$MaxPlies = 180,
  [switch]$SkipPromote
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force local-data/selfplay | Out-Null
New-Item -ItemType Directory -Force local-data/logs | Out-Null
New-Item -ItemType Directory -Force local-models | Out-Null
New-Item -ItemType Directory -Force public/models | Out-Null

$runStamp = Get-Date -Format "yyyyMMdd-HHmmss"
$log = "local-data/logs/train-2d-variants-100-$runStamp.out.log"
$err = "local-data/logs/train-2d-variants-100-$runStamp.err.log"

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

function Add-Job($Jobs, $Game, $Boundary, $Lattice, $Size, $DepthOverride = $null, $EpochOverride = $null, $PlayerCount = $null, $MaxPliesOverride = $null) {
  $Jobs.Add([ordered]@{
    Game = $Game
    Boundary = $Boundary
    Lattice = $Lattice
    Size = $Size
    Depth = if ($null -ne $DepthOverride) { $DepthOverride } else { $Depth }
    Epochs = if ($null -ne $EpochOverride) { $EpochOverride } else { $Epochs }
    PlayerCount = $PlayerCount
    MaxPlies = if ($null -ne $MaxPliesOverride) { $MaxPliesOverride } else { $MaxPlies }
  }) | Out-Null
}

$jobs = New-Object System.Collections.Generic.List[object]

# 2D Chess boundaries.
foreach ($boundary in @("standard", "open", "periodic", "reflection", "random")) {
  Add-Job $jobs "2dchess" $boundary "square" 8 2 8 $null 160
}

# 2D Go boards and current stable lattices. Kagome is excluded from this release
# batch because the public UI currently hides it.
foreach ($boundary in @("open2d", "cylinder", "pbc", "klein", "random")) {
  foreach ($lattice in @("square", "honeycomb", "triangular")) {
    Add-Job $jobs "2dgo" $boundary $lattice 9 1 8
  }
}
Add-Job $jobs "2dgo" "polar" "square" 9 1 8

# 2D Reversi: stable square and honeycomb boards.
foreach ($boundary in @("open2d", "cylinder", "pbc", "klein", "random")) {
  foreach ($lattice in @("square", "honeycomb")) {
    Add-Job $jobs "2dreversi" $boundary $lattice 8 2 8
  }
}

# 2D Jump, including Chinese Checkers-style diamond openings and topology variants.
foreach ($lattice in @("triangular", "square")) {
  Add-Job $jobs "2djump" "diamond" $lattice 12 1 8 2
  Add-Job $jobs "2djump" "diamond" $lattice 12 1 8 3
}
foreach ($boundary in @("plane", "polar", "cylinder", "torus", "mobius", "klein", "rp2", "sphere")) {
  $lattices = if ($boundary -eq "polar") { @("square") } else { @("square", "triangular") }
  foreach ($lattice in $lattices) {
    Add-Job $jobs "2djump" $boundary $lattice 8 1 8 $null
  }
}

# 2D Hex. Kagome is excluded from this release batch because the public UI hides it.
foreach ($boundary in @("open", "cylinder", "torus", "mobius", "klein", "rp2", "random")) {
  foreach ($lattice in @("hexagonal", "square", "triangular")) {
    Add-Job $jobs "2dhex" $boundary $lattice 9 2 8
  }
}

Write-Log "Started 2D robot training: $($jobs.Count) variants, $Games games each."
Write-Log "Output log: $log"
Write-Log "Error/progress log: $err"

$completed = 0
try {
  foreach ($job in $jobs) {
    $playerPart = if ($null -ne $job.PlayerCount) { "-p$($job.PlayerCount)" } else { "" }
    $stem = "$($job.Game)-$($job.Boundary)-$($job.Lattice)-s$($job.Size)$playerPart-100"
    $data = "local-data/selfplay/$stem.jsonl"
    $model = "local-models/$stem-linear.json"

    Write-Log "Self-play: $stem"
    Invoke-Native {
      $args = @(
        "run", "research:selfplay", "--",
        "--game", $job.Game,
        "--boundary", $job.Boundary,
        "--lattice", $job.Lattice,
        "--size", $job.Size,
        "--games", $Games,
        "--maxPlies", $job.MaxPlies,
        "--depthA", $job.Depth,
        "--depthB", $job.Depth,
        "--record", "moves",
        "--state", "true",
        "--out", $data
      )
      if ($null -ne $job.PlayerCount) { $args += @("--playerCount", $job.PlayerCount) }
      & npm.cmd @args 2>> $err
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

  Write-Log "Finished 2D robot training: $completed/$($jobs.Count) variants."
} catch {
  Add-Content -Path $err -Value "[$(Get-Date -Format o)] $($_.Exception.Message)"
  Write-Log "Stopped after $completed/$($jobs.Count) variants because of an error. See $err"
  throw
}
