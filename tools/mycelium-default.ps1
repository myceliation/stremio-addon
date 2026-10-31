# Makes every Stremio shortcut (desktop, Start menu, taskbar) and stremio:// links open
# the official Stremio app with the Mycelium interface. Run with -Undo to put them back.
# Only shortcut arguments and the stremio:// handler change; Stremio itself is untouched.
param([switch]$Undo)
$ErrorActionPreference = 'Continue'
$exe = Join-Path $env:LOCALAPPDATA 'Programs\Stremio\stremio-shell-ng.exe'
$ui  = 'https://mycelium.myceliation.workers.dev/ui/'
if (-not (Test-Path $exe)) { Write-Host "Stremio isn't installed at $exe"; exit 1 }

$shell = New-Object -ComObject WScript.Shell
$places = @(
  [Environment]::GetFolderPath('Desktop'),
  [Environment]::GetFolderPath('Programs'),
  [Environment]::GetFolderPath('CommonDesktopDirectory'),
  [Environment]::GetFolderPath('CommonPrograms'),
  (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar'),
  (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\StartMenu')
) | Where-Object { $_ -and (Test-Path $_) }

$changed = 0
foreach ($dir in $places) {
  Get-ChildItem -Path $dir -Filter *.lnk -Recurse -Depth 2 -ErrorAction SilentlyContinue | ForEach-Object {
    $path = $_.FullName
    $lnk = $shell.CreateShortcut($path)
    if ($lnk.TargetPath -like '*stremio-shell-ng.exe') {
      $lnk.Arguments = if ($Undo) { '' } else { "--webui-url=`"$ui`"" }
      try { $lnk.Save(); $changed++; Write-Host "  updated $path" }
      catch { Write-Host "  skipped $path (needs admin)" }
    }
  }
}

# stremio:// links (add-on install links, "open in app") when Stremio isn't already running
$key = 'HKCU:\Software\Classes\stremio\shell\open\command'
if (-not $Undo -and -not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
if (Test-Path $key) {
  $cmd = if ($Undo) { "`"$exe`" `"%1`"" } else { "`"$exe`" --webui-url=`"$ui`" `"%1`"" }
  Set-ItemProperty -Path $key -Name '(default)' -Value $cmd
  Write-Host "  updated stremio:// link handler"
}

if ($Undo) { Write-Host "`nDone: $changed shortcut(s) back to plain Stremio." }
else { Write-Host "`nDone: $changed shortcut(s) now open Stremio with Mycelium. Quit Stremio (tray icon > Quit) and reopen it." }
Write-Host "Stremio's own updater relaunches it the plain way once after an update; the next normal launch uses Mycelium again."
