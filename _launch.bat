@echo off
cd /d "%~dp0"

rem Kill existing servers on 7000 and 7001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":7000 " ^| findstr "LISTENING" 2^>nul') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":7001 " ^| findstr "LISTENING" 2^>nul') do taskkill /f /pid %%a 2>nul

timeout /t 1 /nobreak >nul

rem Activate conda so pythonw points to Anaconda (tries common install locations)
call "%USERPROFILE%\anaconda3\Scripts\activate.bat" 2>nul
call "%USERPROFILE%\miniconda3\Scripts\activate.bat" 2>nul
call "%USERPROFILE%\AppData\Local\anaconda3\Scripts\activate.bat" 2>nul
call "%USERPROFILE%\AppData\Local\miniconda3\Scripts\activate.bat" 2>nul

rem start "" launches independent process -- pythonw = no console window ever
start "" pythonw "%~dp0run_addon.py"
timeout /t 3 /nobreak >nul
start "" pythonw "%~dp0run_companion.py"