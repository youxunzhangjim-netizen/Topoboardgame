@echo off
cd /d "%~dp0.."
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\Train-AfterCurrent2DLattices100.ps1 -WaitForPid 0 -Games 100 -Epochs 8
