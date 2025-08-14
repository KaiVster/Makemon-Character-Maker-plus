@echo off
echo Makemon Character Maker + (Powershell Version)
echo ===========================
echo.

pushd "%~dp0"
powershell -ExecutionPolicy Bypass -File "Powershell server.ps1"

popd
pause
