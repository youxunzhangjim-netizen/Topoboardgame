@echo off
setlocal
cd /d "%~dp0"
echo Starting Topoboardgame local app...
node tools\local-app-launcher.mjs
if errorlevel 1 (
  echo.
  echo If this is the first run, install Node.js and then run: npm install
  pause
)
