param(
  [int]$Games = 100,
  [int]$Epochs = 8
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force local-data/selfplay | Out-Null
New-Item -ItemType Directory -Force local-models | Out-Null

$jobs = @(
  @{ Game = "2dchess"; Boundary = "periodic"; Lattice = "square"; Size = 8; Depth = 1 },
  @{ Game = "2dchess"; Boundary = "reflection"; Lattice = "square"; Size = 8; Depth = 1 },
  @{ Game = "2dgo"; Boundary = "pbc"; Lattice = "square"; Size = 9; Depth = 1 },
  @{ Game = "2dreversi"; Boundary = "pbc"; Lattice = "square"; Size = 8; Depth = 2 }
)

foreach ($job in $jobs) {
  $stem = "$($job.Game)-$($job.Boundary)-$($job.Lattice)-s$($job.Size)-100"
  $data = "local-data/selfplay/$stem.jsonl"
  $model = "local-models/$stem-linear.json"

  Write-Host ""
  Write-Host "=== Self-play: $stem ==="
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
    --out $data
  if ($LASTEXITCODE -ne 0) { throw "Self-play failed for $stem" }

  Write-Host "=== Train: $model ==="
  & npm.cmd run ml:train-linear -- `
    --in $data `
    --out $model `
    --epochs $Epochs `
    --lr 0.04 `
    --l2 0.0005 `
    --game $job.Game
  if ($LASTEXITCODE -ne 0) { throw "Training failed for $stem" }
}

Write-Host ""
Write-Host "Finished all four 100-game starter datasets and models."
