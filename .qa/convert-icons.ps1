$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$icoDir = 'H:\Devspirehub AI\assets\img\icons'
$pairs = @(
  @('openai', 'C:\Users\BALSAM\AppData\Local\Temp\fav-openai.ico'),
  @('google-deepmind', 'C:\Users\BALSAM\AppData\Local\Temp\fav-google.ico'),
  @('zhipu', 'C:\Users\BALSAM\AppData\Local\Temp\fav-zhipu.png'),
  @('anthropic', 'https://www.anthropic.com/favicon.ico'),
  @('cohere', 'https://cohere.com/favicon.ico'),
  @('falcon-tii', 'https://falconllm.tii.ae/favicon.ico'),
  @('moondream', 'https://moondream.ai/favicon.ico'),
  @('allenai', 'https://www.allenai.org/favicon.ico'),
  @('kuaishou', 'https://www.kuaishou.com/favicon.ico'),
  @('voyage', 'https://www.voyageai.com/favicon.ico'),
  @('github', 'https://github.com/favicon.ico'),
  @('huggingface', 'https://huggingface.co/favicon.ico')
)
$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
foreach ($p in $pairs) {
  $slug = $p[0]
  $src = $p[1]
  try {
    if ($src -like 'http*') {
      $bytes = $wc.DownloadData($src)
      $tmp = Join-Path $env:TEMP ('favconv-' + $slug + '.ico')
      [System.IO.File]::WriteAllBytes($tmp, $bytes)
      $src = $tmp
    }
    $bmp = $null
    $sig = [System.IO.File]::ReadAllBytes($src)[0..3]
    if ($sig[0] -eq 0x89 -and $sig[1] -eq 0x50) {
      $bmp = New-Object System.Drawing.Bitmap($src)
    } else {
      $icon = New-Object System.Drawing.Icon($src)
      $bmp = $icon.ToBitmap()
    }
    $out = New-Object System.Drawing.Bitmap(64, 64)
    $g = [System.Drawing.Graphics]::FromImage($out)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.DrawImage($bmp, 0, 0, 64, 64)
    $g.Dispose()
    $dest = Join-Path $icoDir ($slug + '.png')
    $out.Save($dest, 'Png')
    Write-Output ($slug + ' OK -> ' + $dest)
  } catch {
    Write-Output ($slug + ' FAIL: ' + $_.Exception.Message)
  }
}
