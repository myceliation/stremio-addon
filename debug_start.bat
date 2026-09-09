@echo off
cd /d "%~dp0"
echo ===== COMPANION DEBUG =====
echo Trying Python from PATH...
python run_companion.py
echo.
echo ===== EXIT CODE: %errorlevel% =====
pause
