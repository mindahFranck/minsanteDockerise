Add-Type -AssemblyName System.Drawing

function New-PWAIcon {
    param(
        [int]$Size,
        [string]$OutPath,
        [bool]$Maskable = $false
    )

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background
    $bgRect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
    if ($Maskable) {
        # Maskable: full bleed, no rounded corners (safe area centered)
        $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $bgRect, ([System.Drawing.Color]::FromArgb(13,110,253)), ([System.Drawing.Color]::FromArgb(8,67,168)), 45
        $g.FillRectangle($bgBrush, 0, 0, $Size, $Size)
    } else {
        # Rounded square
        $radius = [int]($Size * 0.1875)
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddArc(0, 0, $radius * 2, $radius * 2, 180, 90)
        $path.AddArc($Size - $radius * 2, 0, $radius * 2, $radius * 2, 270, 90)
        $path.AddArc($Size - $radius * 2, $Size - $radius * 2, $radius * 2, $radius * 2, 0, 90)
        $path.AddArc(0, $Size - $radius * 2, $radius * 2, $radius * 2, 90, 90)
        $path.CloseFigure()
        $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $bgRect, ([System.Drawing.Color]::FromArgb(13,110,253)), ([System.Drawing.Color]::FromArgb(8,67,168)), 45
        $g.FillPath($bgBrush, $path)
    }

    # Cross (medical symbol) — scaled
    $cx = $Size / 2.0
    $cy = $Size / 2.0
    $scale = $Size / 512.0
    if ($Maskable) { $scale = $scale * 0.7 } # safe zone

    $whiteBrush = [System.Drawing.Brushes]::White

    # Vertical bar
    $vw = 60 * $scale
    $vh = 220 * $scale
    $g.FillRectangle($whiteBrush, [single]($cx - $vw / 2), [single]($cy - $vh / 2), [single]$vw, [single]$vh)

    # Horizontal bar
    $hw = 220 * $scale
    $hh = 60 * $scale
    $g.FillRectangle($whiteBrush, [single]($cx - $hw / 2), [single]($cy - $hh / 2), [single]$hw, [single]$hh)

    # Red dot in center
    $redBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(239,68,68))
    $dotR = 18 * $scale
    $g.FillEllipse($redBrush, [single]($cx - $dotR), [single]($cy - $dotR), [single]($dotR * 2), [single]($dotR * 2))

    # Save
    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    $bgBrush.Dispose()
    $redBrush.Dispose()
    Write-Host "  -> $OutPath ($Size x $Size)"
}

$base = Split-Path $PSScriptRoot -Parent
$iconsDir = Join-Path $base "public\icons"
if (-not (Test-Path $iconsDir)) { New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null }

Write-Host "Generating PWA icons in $iconsDir"
New-PWAIcon -Size 192 -OutPath (Join-Path $iconsDir "icon-192.png")
New-PWAIcon -Size 512 -OutPath (Join-Path $iconsDir "icon-512.png")
New-PWAIcon -Size 512 -OutPath (Join-Path $iconsDir "icon-maskable-512.png") -Maskable $true
New-PWAIcon -Size 180 -OutPath (Join-Path $iconsDir "apple-touch-icon.png")
New-PWAIcon -Size 32  -OutPath (Join-Path $iconsDir "favicon-32.png")
Write-Host "Done."
