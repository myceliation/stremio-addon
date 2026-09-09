@echo off
cd /d "%~dp0"

:: Write diagnostic info to a file I can read
echo DIAGNOSTIC > logs\diag.txt
where python >> logs\diag.txt 2>&1
where pythonw >> logs\diag.txt 2>&1
python --version >> logs\diag.txt 2>&1
echo USERPROFILE=%USERPROFILE% >> logs\diag.txt
echo PATH=%PATH% >> logs\diag.txt

:: Check for errors in companion app
python -c "import sys; sys.path.insert(0,'.'); from companion.app import app; print('OK')" >> logs\diag.txt 2>&1

echo Done. Check logs\diag.txt
pause
