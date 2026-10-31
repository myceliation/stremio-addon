@echo off
setlocal
rem Applies each patch to your fork on its own branch, pushes it, and opens GitHub's "create pull request" page.
rem Fork https://github.com/Stremio/stremio-web and https://github.com/Stremio/stremio-shell-ng first.
set "HERE=%~dp0"
set "WORK=%TEMP%\stremio-fixes"
if exist "%WORK%" rmdir /s /q "%WORK%"
mkdir "%WORK%"
call :one stremio-web development fix/deeplink-port-and-query stremio-web-1-deeplink-port-and-query.patch || goto :fail
call :one stremio-web development fix/discover-multiselect-extra-title stremio-web-2-discover-multiselect-title.patch || goto :fail
call :one stremio-shell-ng main fix/reclaim-stale-protocol-handler stremio-shell-ng-1-reclaim-stremio-links.patch || goto :fail
echo.
echo All three branches are pushed. Finish each pull request in the browser tabs that opened.
pause
exit /b 0

:one
set "REPO=%1" & set "BASE=%2" & set "BR=%3" & set "PATCH=%4"
echo.
echo === %REPO%: %BR%
if not exist "%WORK%\%REPO%" (
  git clone --depth 50 https://github.com/myceliation/%REPO%.git "%WORK%\%REPO%" || (echo Couldn't clone myceliation/%REPO%. Did you click Fork on GitHub? & exit /b 1)
  git -C "%WORK%\%REPO%" remote add upstream https://github.com/Stremio/%REPO%.git
)
git -C "%WORK%\%REPO%" fetch --depth 50 upstream %BASE% || exit /b 1
git -C "%WORK%\%REPO%" checkout -B %BR% upstream/%BASE% || exit /b 1
git -C "%WORK%\%REPO%" am --3way "%HERE%%PATCH%" || (git -C "%WORK%\%REPO%" am --abort & echo The patch no longer applies cleanly: Stremio changed that file since. & exit /b 1)
git -C "%WORK%\%REPO%" push -u origin %BR% --force || exit /b 1
start "" "https://github.com/Stremio/%REPO%/compare/%BASE%...myceliation:%REPO%:%BR%?expand=1"
exit /b 0

:fail
echo.
echo Stopped. Nothing was submitted for the step that failed.
pause
exit /b 1
