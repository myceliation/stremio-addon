@echo off
cd /d "%~dp0"

:: Kill anything on 7000 and 7001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":7000 " ^| findstr "LISTENING"') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":7001 " ^| findstr "LISTENING"') do taskkill /f /pid %%a 2>nul
timeout /t 1 /nobreak >nul

:: cramjam reads Stremio's compressed local storage (Watch history tab)
python -c "import cramjam" 2>nul || python -m pip install --quiet cramjam

:: Start addon in its own window (minimize it after it appears)
start "Stremio Addon 7000" python run_addon.py
timeout /t 3 /nobreak >nul

:: Start companion in its own window (minimize it after it appears)
start "Stremio Companion 7001" python run_companion.py
timeout /t 2 /nobreak >nul

:: Open browser
start http://localhost:7001
