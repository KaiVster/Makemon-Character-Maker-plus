@echo off
echo Makemon Character Maker + (Windows)
echo ===========================
echo.

:: Check if Python is available (preferred)
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Python...
    echo Server running at http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    start http://localhost:8000/app/Makemon.html

    python -m http.server 8000
    goto :EOF
)

:: Check if Python3 is available
where python3 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Python3...
    echo Server running at http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    start http://localhost:8000/app/Makemon.html

    python3 -m http.server 8000
    goto :EOF
)

:: Check if Node.js http-server is available
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Node.js http-server...
    echo If http-server is not installed, it will be installed temporarily.
    echo Server running at http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    start http://localhost:8000/app/Makemon.html

    npx http-server -p 8000
    goto :EOF
)

:: Fallback to PowerShell script
echo.
echo Python and Node.js not found or failed to start.
echo Attempting to launch server using Start PowerShell.bat...
echo If Start PowerShell.bat is missing, please ensure it's in the same directory as Start.bat.
echo.
call "%~dp0Start PowerShell.bat"
goto :EOF

pause
