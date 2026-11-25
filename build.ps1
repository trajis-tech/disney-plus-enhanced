# Builds dist\DisneyPlus.exe (single self-contained exe) and, when Inno Setup 6 is installed,
# the installer dist\DisneyPlus-Setup-<version>.exe from installer\DisneyPlus.iss.
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$project = Join-Path $root 'src\DisneyPlusDesktop\DisneyPlusDesktop.csproj'
$dist = Join-Path $root 'dist'

dotnet publish $project -c Release -o $dist
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed ($LASTEXITCODE)" }

$iscc = @(
    (Get-Command iscc -ErrorAction SilentlyContinue).Source
    "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
    "$env:ProgramFiles\Inno Setup 6\ISCC.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

if ($iscc) {
    # Antivirus scanning the new setup exe can make the compiler's resource update fail; try again.
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        & $iscc /Q (Join-Path $root 'installer\DisneyPlus.iss') 2>&1 | Write-Host
        if ($LASTEXITCODE -eq 0) { break }
        if ($attempt -eq 3) { throw "Inno Setup failed ($LASTEXITCODE)" }
        Start-Sleep -Seconds 3
    }
} else {
    Write-Warning 'Inno Setup 6 not found, so only the portable exe was built (winget install JRSoftware.InnoSetup).'
}

Get-ChildItem $dist -Filter 'DisneyPlus*.exe' |
    Select-Object Name, @{ n = 'SizeMB'; e = { [math]::Round($_.Length / 1MB, 1) } }, LastWriteTime
