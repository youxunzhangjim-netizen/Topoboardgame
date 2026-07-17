@echo off
cd /d "%~dp0\.."
C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\Train-3DVariants100.ps1 -Games 100 -Epochs 8
