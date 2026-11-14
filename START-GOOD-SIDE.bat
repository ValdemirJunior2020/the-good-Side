@echo off
setlocal
cd /d "%~dp0"
title The Good Side - Start Everything
echo.
echo ==============================================
echo          THE GOOD SIDE - START ALL
echo ==============================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-goodside.ps1"
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" (
 echo One or more services need attention. Check the status above.
) else (
 echo Startup check completed.
)
echo.
pause
exit /b %RC%
