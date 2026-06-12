@echo off
cd /d "%~dp0"
echo Starting 3D Chess local server...
echo.
echo If the browser does not open, go to:
echo http://127.0.0.1:5173/
echo.
npm.cmd run local
pause
