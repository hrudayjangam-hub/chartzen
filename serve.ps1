$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:3000/")
$listener.Start()
Write-Host "ChartGen server running at http://localhost:3000"

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    $filePath = Join-Path "c:\chartgen2" ($path.TrimStart("/"))
    $resp = $ctx.Response

    if (Test-Path $filePath) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath)
        switch ($ext) {
            ".html" { $resp.ContentType = "text/html; charset=utf-8" }
            ".css"  { $resp.ContentType = "text/css; charset=utf-8" }
            ".js"   { $resp.ContentType = "application/javascript; charset=utf-8" }
            ".png"  { $resp.ContentType = "image/png" }
            ".jpg"  { $resp.ContentType = "image/jpeg" }
            ".svg"  { $resp.ContentType = "image/svg+xml" }
            ".json" { $resp.ContentType = "application/json" }
            default { $resp.ContentType = "application/octet-stream" }
        }
        $resp.ContentLength64 = $bytes.Length
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        # SPA fallback: serve index.html for unknown routes
        $indexPath = Join-Path "c:\chartgen2" "index.html"
        $bytes = [System.IO.File]::ReadAllBytes($indexPath)
        $resp.ContentType = "text/html; charset=utf-8"
        $resp.ContentLength64 = $bytes.Length
        $resp.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $resp.Close()
}
