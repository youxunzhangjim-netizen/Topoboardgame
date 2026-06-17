param(
  [string]$Game = "2dchess",
  [string]$Boundary = "periodic",
  [string]$Lattice = "square",
  [int]$Games = 100,
  [int]$Depth = 2,
  [string]$OutData = "",
  [string]$OutModel = ""
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force local-data/selfplay | Out-Null
New-Item -ItemType Directory -Force local-models | Out-Null

if ($OutData -eq "") { $OutData = "local-data/selfplay/$Game-$Boundary-$Lattice-smoke.jsonl" }
if ($OutModel -eq "") { $OutModel = "local-models/$Game-$Boundary-$Lattice-linear.json" }

Write-Host "[1/3] Generating self-play data -> $OutData"
npm run research:selfplay -- --game $Game --boundary $Boundary --lattice $Lattice --games $Games --depthA $Depth --depthB $Depth --record moves --state true --maxPlies 30 --out $OutData

Write-Host "[2/3] Training linear robot -> $OutModel"
npm run ml:train-linear -- --in $OutData --out $OutModel --epochs 8 --lr 0.05 --l2 0.0005

Write-Host "[3/3] Evaluating model"
npm run ml:evaluate-linear -- --model $OutModel --in $OutData

Write-Host "Done. Model: $OutModel"
