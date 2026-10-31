@echo off
rem Puts every Stremio shortcut back to plain Stremio.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0mycelium-default.ps1" -Undo
pause
