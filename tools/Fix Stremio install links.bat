@echo off
rem Makes the "Install" buttons on add-on websites (stremio:// links) open Stremio 5.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-stremio-links.ps1"
pause
