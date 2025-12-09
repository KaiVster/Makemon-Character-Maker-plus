@echo off
echo Makemon Character Maker + (Windows)
echo ===================================
echo.

:: Check if Python is available (preferred)
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting server with Python...
    echo Server running at http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    start http://localhost:8000/
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
    start http://localhost:8000/
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
    start http://localhost:8000/
    npx http-server -p 8000
    goto :EOF
)

:: Fallback to PowerShell embedded server
echo.
echo Python and Node.js not found. Starting PowerShell server...
echo Server running at http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

powershell -ExecutionPolicy Bypass -Command ^
$listener = New-Object System.Net.HttpListener; ^
$listener.Prefixes.Add('http://localhost:8000/'); ^
$listener.Start(); ^
Start-Process 'http://localhost:8000/' -ErrorAction SilentlyContinue; ^
Write-Host 'PowerShell Server running at http://localhost:8000'; ^
Write-Host 'Press Ctrl+C to stop'; ^
$mimeTypes = @{'.html'='text/html; charset=utf-8';'.js'='application/javascript; charset=utf-8';'.css'='text/css; charset=utf-8';'.png'='image/png';'.jpg'='image/jpeg';'.gif'='image/gif';'.svg'='image/svg+xml';'.json'='application/json; charset=utf-8';'.otf'='font/otf';'.woff'='font/woff';'.woff2'='font/woff2'}; ^
$rootPath = (Get-Location).Path; ^
try { ^
    while ($listener.IsListening) { ^
        $context = $listener.GetContext(); ^
        $request = $context.Request; ^
        $response = $context.Response; ^
        $localPath = $request.Url.LocalPath; ^
        $requestedFile = ($localPath -replace '^/+', '' -replace '/', [System.IO.Path]::DirectorySeparatorChar); ^
        if ($requestedFile -eq '' -or $requestedFile -eq [System.IO.Path]::DirectorySeparatorChar) { $requestedFile = 'index.html' }; ^
        $filePath = Join-Path -Path $rootPath -ChildPath $requestedFile; ^
        $normalizedFilePath = (Resolve-Path -Path $filePath -ErrorAction SilentlyContinue).Path; ^
        if ($null -ne $normalizedFilePath -and $normalizedFilePath.StartsWith($rootPath) -and (Test-Path $normalizedFilePath -PathType Leaf)) { ^
            $extension = [System.IO.Path]::GetExtension($normalizedFilePath).ToLowerInvariant(); ^
            $contentType = $mimeTypes[$extension]; ^
            if (-not $contentType) { $contentType = 'application/octet-stream' }; ^
            $fileContent = [System.IO.File]::ReadAllBytes($normalizedFilePath); ^
            $response.ContentType = $contentType; ^
            $response.ContentLength64 = $fileContent.Length; ^
            $response.OutputStream.Write($fileContent, 0, $fileContent.Length); ^
        } else { ^
            $response.StatusCode = 404; ^
            $notFoundMessage = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found: ' + $request.Url.LocalPath); ^
            $response.ContentType = 'text/plain; charset=utf-8'; ^
            $response.ContentLength64 = $notFoundMessage.Length; ^
            $response.OutputStream.Write($notFoundMessage, 0, $notFoundMessage.Length); ^
        }; ^
        $response.Close(); ^
    } ^
} finally { ^
    if ($listener.IsListening) { $listener.Stop() } ^
}

pause
