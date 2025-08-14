$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8000/')
$listener.Start()

try {
    # Try to open the browser, but don't stop the script if it fails
    Start-Process 'http://localhost:8000/app/Makemon.html' -ErrorAction SilentlyContinue
} catch {
    Write-Warning 'Could not automatically open browser. Please navigate to http://localhost:8000/app/Makemon.html manually.'
}

Write-Host 'PowerShell Server running at http://localhost:8000'
Write-Host 'Serving files from:' (Get-Location).Path
Write-Host 'To stop the server: Close this window'

$mimeTypes = @{
    '.htm'  = 'text/html; charset=utf-8'
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.json' = 'application/json; charset=utf-8'
}

$rootPath = (Resolve-Path -Path '.').Path # Use resolved path for robustness

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        # Sanitize localPath to prevent directory traversal
        $requestedFile = ($localPath -replace '^/+', '' -replace '/', [System.IO.Path]::DirectorySeparatorChar)
        if ($requestedFile -eq '' -or $requestedFile -eq [System.IO.Path]::DirectorySeparatorChar) {
            $requestedFile = 'app/Makemon.html'
        }
        
        $filePath = Join-Path -Path $rootPath -ChildPath $requestedFile
        
        # Normalize path and check if it's within the root directory
        $normalizedFilePath = (Resolve-Path -Path $filePath -ErrorAction SilentlyContinue).Path
        
        if ($null -ne $normalizedFilePath -and $normalizedFilePath.StartsWith($rootPath) -and (Test-Path $normalizedFilePath -PathType Leaf)) {
            $extension = [System.IO.Path]::GetExtension($normalizedFilePath).ToLowerInvariant()
            $contentType = $mimeTypes[$extension]
            
            if (-not $contentType) {
                $contentType = 'application/octet-stream'
            }
            
            try {
                $fileContent = [System.IO.File]::ReadAllBytes($normalizedFilePath)
                $response.ContentType = $contentType
                $response.ContentLength64 = $fileContent.Length
                $response.OutputStream.Write($fileContent, 0, $fileContent.Length)
            } catch {
                $response.StatusCode = 500 # Internal Server Error
                $errorMessage = [System.Text.Encoding]::UTF8.GetBytes('500 Internal Server Error: Could not read file.')
                $response.ContentType = 'text/plain; charset=utf-8'
                $response.ContentLength64 = $errorMessage.Length
                $response.OutputStream.Write($errorMessage, 0, $errorMessage.Length)
            }
        } else {
            $response.StatusCode = 404 # Not Found
            $notFoundMessage = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found: ' + $request.Url.LocalPath)
            $response.ContentType = 'text/plain; charset=utf-8'
            $response.ContentLength64 = $notFoundMessage.Length
            $response.OutputStream.Write($notFoundMessage, 0, $notFoundMessage.Length)
        }
        
        $response.Close()
    }
} catch {
    Write-Host "----- POWERSHELL SERVER ERROR -----" -ForegroundColor Red
    Write-Error "An error occurred in the server loop. Details below:"
    Write-Error $_ # This is the actual error object
    Write-Host "The PowerShell server script will now terminate." -ForegroundColor Yellow
    Read-Host "Press ENTER to acknowledge this error and allow the script to exit."
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
        Write-Host 'PowerShell Server stopped.'
    }
}
