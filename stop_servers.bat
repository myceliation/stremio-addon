@echo off
:: Stremio Add-on Suite — Stop Both Servers
echo Stopping servers on ports 7000 and 7001...

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":7000 "') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":7001 "') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Done. Both servers have been stopped.
timeout /t 2 /nobreak >nul
