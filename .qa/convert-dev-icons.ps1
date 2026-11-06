$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$icoDir = 'H:\Devspirehub AI\assets\img\icons'
$pairs = @(
  @('qdrant', 'qdrant.tech'),
  @('pinecone', 'pinecone.io'),
  @('weaviate', 'weaviate.io'),
  @('langfuse', 'langfuse.com'),
  @('chroma', 'trychroma.com'),
  @('microsoft', 'microsoft.com'),
  @('mcp', 'modelcontextprotocol.io'),
  @('litellm', 'litellm.ai'),
  @('nvidia', 'nvidia.com'),
  @('dspy', 'dspy.ai'),
  @('modal', 'modal.com'),
  @('runpod', 'runpod.io'),
  @('braintrust', 'braintrust.dev'),
  @('arize', 'arize.com'),
  @('guardrails-ai', 'guardrailsai.com'),
  @('postgresql', 'postgresql.org'),
  @('lancedb', 'lancedb.com'),
  @('milvus', 'milvus.io'),
  @('meta', 'meta.ai'),
  @('deepset', 'deepset.ai'),
  @('ragflow', 'ragflow.io'),
  @('langflow', 'langflow.org'),
  @('localai', 'localai.io'),
  @('jan', 'jan.ai'),
  @('apple', 'apple.com'),
  @('confident-ai', 'confident-ai.com'),
  @('ragas', 'ragas.io')
)
$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
foreach ($p in $pairs) {
  $slug = $p[0]
  $domain = $p[1]
  $url = 'https://www.google.com/s2/favicons?domain=' + $domain + '&sz=128'
  try {
    $bytes = $wc.DownloadData($url)
    if ($bytes.Length -lt 200) { throw ('too small: ' + $bytes.Length + ' bytes') }
    $tmp = Join-Path $env:TEMP ('favdev-' + $slug + '.bin')
    [System.IO.File]::WriteAllBytes($tmp, $bytes)
    $sig = [System.IO.File]::ReadAllBytes($tmp)[0..3]
    $bmp = $null
    if ($sig[0] -eq 0x89 -and $sig[1] -eq 0x50) {
      $bmp = New-Object System.Drawing.Bitmap($tmp)
    } else {
      $icon = New-Object System.Drawing.Icon($tmp)
      $bmp = $icon.ToBitmap()
    }
    $out = New-Object System.Drawing.Bitmap(64, 64)
    $g = [System.Drawing.Graphics]::FromImage($out)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.SmoothingMode = 'HighQuality'
    $g.DrawImage($bmp, 0, 0, 64, 64)
    $g.Dispose()
    $dest = Join-Path $icoDir ($slug + '.png')
    $out.Save($dest, 'Png')
    $out.Dispose()
    $bmp.Dispose()
    Write-Output ($slug + ' OK ' + $bytes.Length + 'b')
  } catch {
    Write-Output ($slug + ' FAIL: ' + $_.Exception.Message)
  }
  Start-Sleep -Milliseconds 350
}
