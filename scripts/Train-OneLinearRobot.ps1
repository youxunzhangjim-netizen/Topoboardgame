param(
  [Parameter(Mandatory=$true)][string]$Game,
  [string]$Boundary = "standard",
  [string]$Lattice = "square",
  [int]$Size = 0,
  [int]$Games = 10000,
  [int]$DepthA = 2,
  [int]$DepthB = 2,
  [int]$Epochs = 12,
  [double]$LearningRate = 0.05,
  [double]$L2 = 0.0005
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force local-data/selfplay | Out-Null
New-Item -ItemType Directory -Force local-data/summaries | Out-Null
New-Item -ItemType Directory -Force local-models | Out-Null

$sizePart = if ($Size -gt 0) { "-s$Size" } else { "" }
$base = "$Game-$Boundary-$Lattice$sizePart"
$data = "local-data/selfplay/$base-train.jsonl"
$model = "local-models/$base-linear.json"
$eval = "local-data/selfplay/eval-$base-linear-vs-builtin.jsonl"
$summary = "local-data/summaries/eval-$base-linear-vs-builtin-summary.json"

$selfplayArgs = @("run", "research:selfplay", "--", "--game", $Game, "--boundary", $Boundary, "--lattice", $Lattice, "--games", $Games, "--depthA", $DepthA, "--depthB", $DepthB, "--record", "moves", "--state", "true", "--out", $data)
if ($Size -gt 0) { $selfplayArgs += @("--size", $Size) }

Write-Host "[1/4] Self-play: $base"
npm @selfplayArgs

Write-Host "[2/4] Train: $model"
npm run ml:train-linear -- --in $data --out $model --epochs $Epochs --lr $LearningRate --l2 $L2

Write-Host "[3/4] Tournament: linear vs builtin"
$evalArgs = @("run", "research:selfplay", "--", "--game", $Game, "--boundary", $Boundary, "--lattice", $Lattice, "--botA", "linear", "--modelA", $model, "--botB", "builtin", "--depthB", $DepthB, "--games", 500, "--out", $eval)
if ($Size -gt 0) { $evalArgs += @("--size", $Size) }
npm @evalArgs

Write-Host "[4/4] Aggregate"
npm run research:aggregate -- --in $eval --out $summary

Write-Host "Done. Model: $model"
Write-Host "Summary: $summary"
