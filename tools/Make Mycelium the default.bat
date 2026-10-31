@echo off
rem Every Stremio shortcut opens Stremio with the Mycelium interface from now on.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0mycelium-default.ps1"
pause
