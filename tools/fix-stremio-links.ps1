# Checks what Windows opens for stremio:// links (the "Install" buttons on add-on sites)
# and points it at the Stremio 5 app if it's pointing somewhere else.
# Stremio 5's installer won't take over the link if another program (often an old
# Stremio 4 install) registered it first, so the buttons silently do nothing.
$ErrorActionPreference = 'SilentlyContinue'
$exe = Join-Path $env:LOCALAPPDATA 'Programs\Stremio\stremio-shell-ng.exe'
Write-Host "Stremio 5 app: $exe  (exists: $(Test-Path $exe))`n"

function Show($label, $path) {
  $v = (Get-ItemProperty -Path $path -Name '(default)' -ErrorAction SilentlyContinue).'(default)'
  if ($v) {
    $target = if ($v -match '^"([^"]+)"') { $Matches[1] } else { ($v -split ' ')[0] }
    Write-Host ("{0,-28} {1}" -f $label, $v)
    Write-Host ("{0,-28} program exists: {1}" -f '', (Test-Path $target))
  } else { Write-Host ("{0,-28} (not set)" -f $label) }
  return $v
}
$user = Show 'Your account (HKCU):' 'HKCU:\Software\Classes\stremio\shell\open\command'
$machine = Show 'All users (HKLM):' 'HKLM:\Software\Classes\stremio\shell\open\command'

# Windows' own "default app for this link type" choice wins over the handler above when it's set
$uc = (Get-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\stremio\UserChoice' -Name ProgId -ErrorAction SilentlyContinue).ProgId
$choiceBroken = $false
if ($uc) {
  Write-Host ("{0,-28} {1}" -f 'Windows default for links:', $uc)
  New-PSDrive -Name HKCR -PSProvider Registry -Root HKEY_CLASSES_ROOT -ErrorAction SilentlyContinue | Out-Null
  $ucCmd = Show '  which runs:' "HKCR:\$uc\shell\open\command"
  if (-not $ucCmd -or $ucCmd -notmatch [regex]::Escape($exe)) { $choiceBroken = $true }
}

if (-not (Test-Path $exe)) { Write-Host "`nStremio 5 isn't installed where expected; nothing changed."; exit 1 }
$keepUi = $user -and $user -match '--webui-url="([^"]+)"'
$want = if ($keepUi) { "`"$exe`" --webui-url=`"$($Matches[1])`" `"%1`"" } else { "`"$exe`" `"%1`"" }
if ($user -eq $want) { Write-Host "`nstremio:// links already open Stremio 5. If Install buttons still do nothing, the browser is blocking them: see the note below." }
else {
  $k = 'HKCU:\Software\Classes\stremio'
  New-Item -Path "$k\shell\open\command" -Force | Out-Null
  Set-ItemProperty -Path $k -Name '(default)' -Value 'URL:Stremio Protocol'
  Set-ItemProperty -Path $k -Name 'URL Protocol' -Value ''
  New-Item -Path "$k\DefaultIcon" -Force | Out-Null
  Set-ItemProperty -Path "$k\DefaultIcon" -Name '(default)' -Value "$exe,0"
  Set-ItemProperty -Path "$k\shell\open\command" -Name '(default)' -Value $want
  Write-Host "`nFixed: stremio:// links now open $exe"
}
if ($choiceBroken) {
  Write-Host "`nWindows is set to open stremio:// links with '$uc', which doesn't run Stremio 5. Windows doesn't let scripts change that choice,"
  Write-Host "so the Default apps page opens now: search 'stremio' under 'Choose defaults by link type' (or 'Set defaults for applications' > Stremio) and pick Stremio."
  Start-Process 'ms-settings:defaultapps'
}
Write-Host "`nBrowser note: if you once clicked 'Cancel' or unticked 'Always allow' on the browser's 'Open Stremio?' prompt,"
Write-Host "Chrome/Edge remember it per site. Reset it in Settings > Privacy and security > Site settings > Additional permissions > Protocol handlers."
Write-Host "Firefox: Settings > General > Applications, find 'stremio' and set it to 'Always ask' or Stremio."
