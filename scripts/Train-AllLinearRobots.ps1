param(
  [ValidateSet("quick", "normal", "large")][string]$Preset = "quick"
)

$ErrorActionPreference = "Stop"
$gamesChess = if ($Preset -eq "quick") { 100 } elseif ($Preset -eq "normal") { 10000 } else { 50000 }
$gamesGo = if ($Preset -eq "quick") { 50 } elseif ($Preset -eq "normal") { 10000 } else { 50000 }
$gamesReversi = if ($Preset -eq "quick") { 100 } elseif ($Preset -eq "normal") { 20000 } else { 80000 }

foreach ($b in @("standard", "open", "periodic", "reflection", "random")) {
  powershell -ExecutionPolicy Bypass -File scripts/Train-OneLinearRobot.ps1 -Game 2dchess -Boundary $b -Lattice square -Games $gamesChess -DepthA 2 -DepthB 2 -Epochs 12
}
foreach ($b in @("open2d", "polar", "pbc", "klein", "random")) {
  foreach ($l in @("square", "honeycomb", "triangular")) {
    powershell -ExecutionPolicy Bypass -File scripts/Train-OneLinearRobot.ps1 -Game 2dgo -Boundary $b -Lattice $l -Size 9 -Games $gamesGo -DepthA 1 -DepthB 1 -Epochs 10
  }
}
foreach ($b in @("open2d", "pbc", "klein", "random")) {
  foreach ($l in @("square", "honeycomb")) {
    powershell -ExecutionPolicy Bypass -File scripts/Train-OneLinearRobot.ps1 -Game 2dreversi -Boundary $b -Lattice $l -Games $gamesReversi -DepthA 3 -DepthB 3 -Epochs 12
  }
}
foreach ($b in @("r3", "t3", "r3_random", "t2", "sphere", "klein", "mobius", "rp2")) {
  foreach ($l in @("sc", "bcc", "fcc", "hcp", "square", "honeycomb", "triangular")) {
    powershell -ExecutionPolicy Bypass -File scripts/Train-OneLinearRobot.ps1 -Game 3dgo -Boundary $b -Lattice $l -Size 5 -Games $gamesGo -DepthA 1 -DepthB 1 -Epochs 8
  }
}
foreach ($b in @("r3", "t3", "r3_random", "t2", "sphere", "klein", "mobius", "rp2")) {
  foreach ($l in @("square", "hcp")) {
    powershell -ExecutionPolicy Bypass -File scripts/Train-OneLinearRobot.ps1 -Game 3dreversi -Boundary $b -Lattice $l -Size 6 -Games $gamesReversi -DepthA 2 -DepthB 2 -Epochs 10
  }
}

Write-Host "All requested trainable headless robots complete. Note: 3dchess UI robot works, but headless ML training needs 3D chess core extraction."
