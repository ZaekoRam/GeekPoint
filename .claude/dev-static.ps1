<#
  GeekPoint — servidor de vista previa SIN PHP.

  Sirve public_html/ como raíz web (igual que dev-server.php / Hostinger) y hace
  de reverse-proxy de /api/* hacia un backend real, para poder previsualizar el
  front-end en una máquina que no tiene XAMPP/PHP instalado.

  Uso (normalmente lo lanza .claude/launch.json -> config "geekpoint-preview"):
    powershell -NoProfile -ExecutionPolicy Bypass -File .claude/dev-static.ps1 -Port 8766

  El upstream de la API se toma de $env:GEEKPOINT_UPSTREAM o, si no está,
  del valor por defecto de abajo.
#>
param(
  [int]$Port = 8766,
  [string]$Upstream = ''
)

$ErrorActionPreference = 'Stop'
if (-not $Upstream) {
  if ($env:GEEKPOINT_UPSTREAM) { $Upstream = $env:GEEKPOINT_UPSTREAM }
  else { $Upstream = 'https://seashell-gorilla-962180.hostingersite.com' }
}
$Upstream = $Upstream.TrimEnd('/')

$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\public_html'))
$index = Join-Path $root 'index.html'
if (-not (Test-Path $index)) { throw "No se encontró $index" }

[System.Net.ServicePointManager]::SecurityProtocol = `
  [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls11 -bor [System.Net.SecurityProtocolType]::Tls

$mime = @{
  '.html'='text/html; charset=utf-8';        '.htm'='text/html; charset=utf-8'
  '.js'='text/javascript; charset=utf-8';    '.mjs'='text/javascript; charset=utf-8'
  '.css'='text/css; charset=utf-8';          '.json'='application/json; charset=utf-8'
  '.map'='application/json; charset=utf-8';  '.svg'='image/svg+xml'
  '.png'='image/png';  '.jpg'='image/jpeg';  '.jpeg'='image/jpeg';  '.gif'='image/gif'
  '.webp'='image/webp'; '.ico'='image/x-icon'; '.avif'='image/avif'
  '.woff'='font/woff'; '.woff2'='font/woff2'; '.ttf'='font/ttf'; '.eot'='application/vnd.ms-fontobject'
  '.mp4'='video/mp4';  '.webm'='video/webm';  '.txt'='text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host ("GeekPoint preview  ->  http://localhost:{0}/   (API proxy -> {1})" -f $Port, $Upstream)

function Send-Bytes($ctx, [int]$status, [string]$contentType, [byte[]]$bytes) {
  $ctx.Response.StatusCode = $status
  if ($contentType) { $ctx.Response.ContentType = $contentType }
  if ($bytes -and $bytes.Length) { $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length) }
  $ctx.Response.OutputStream.Close()
}

while ($listener.IsListening) {
  $ctx = $null
  try { $ctx = $listener.GetContext() } catch { break }
  try {
    $req  = $ctx.Request
    $path = $req.Url.AbsolutePath

    if ($path -eq '/api' -or $path -like '/api/*') {
      # ---------- reverse-proxy de la API ----------
      $target = $Upstream + $path
      if ($req.Url.Query) { $target += $req.Url.Query }

      $pr = [System.Net.HttpWebRequest]::Create($target)
      $pr.Method = $req.HttpMethod
      $pr.AllowAutoRedirect = $true
      $pr.UserAgent = 'geekpoint-preview-proxy'
      $pr.AutomaticDecompression = [System.Net.DecompressionMethods]::GZip -bor [System.Net.DecompressionMethods]::Deflate
      if ($req.Headers['Authorization']) { $pr.Headers['Authorization'] = $req.Headers['Authorization'] }
      if ($req.Headers['Accept'])        { $pr.Accept = $req.Headers['Accept'] }
      if ($req.ContentType)              { $pr.ContentType = $req.ContentType }

      if (@('POST','PUT','PATCH','DELETE') -contains $req.HttpMethod) {
        $ms = New-Object System.IO.MemoryStream
        $req.InputStream.CopyTo($ms)
        $body = $ms.ToArray()
        $pr.ContentLength = $body.Length
        if ($body.Length) {
          $s = $pr.GetRequestStream(); $s.Write($body, 0, $body.Length); $s.Close()
        }
      }

      $pResp = $null
      try { $pResp = $pr.GetResponse() }
      catch [System.Net.WebException] { $pResp = $_.Exception.Response }

      if ($pResp) {
        $out = New-Object System.IO.MemoryStream
        $rs = $pResp.GetResponseStream(); $rs.CopyTo($out); $rs.Close()
        $ct = $pResp.ContentType; if (-not $ct) { $ct = 'application/json; charset=utf-8' }
        Send-Bytes $ctx ([int]$pResp.StatusCode) $ct $out.ToArray()
        $pResp.Close()
      } else {
        Send-Bytes $ctx 502 'application/json; charset=utf-8' `
          ([Text.Encoding]::UTF8.GetBytes('{"ok":false,"error":"proxy_unreachable"}'))
      }
      continue
    }

    # ---------- archivos estáticos + fallback SPA ----------
    $rel  = [Uri]::UnescapeDataString($path.TrimStart('/')) -replace '/', '\'
    $full = ''
    if ($rel -ne '') {
      $full = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
      if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { $full = '' }  # anti path-traversal
    }

    if ($full -ne '' -and (Test-Path -LiteralPath $full -PathType Leaf)) {
      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $ct  = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      Send-Bytes $ctx 200 $ct ([System.IO.File]::ReadAllBytes($full))
    } else {
      Send-Bytes $ctx 200 'text/html; charset=utf-8' ([System.IO.File]::ReadAllBytes($index))
    }
  } catch {
    try { Send-Bytes $ctx 500 'text/plain; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes('preview server error')) } catch {}
  }
}
