
' Creates a Desktop shortcut for the Stremio Add-on Suite launcher.
' Double-click this script once to set it up — you won't need it again.

Option Explicit
Dim shell, fso, dir, shortcut, desktop

Set shell = CreateObject("WScript.Shell")
Set fso   = CreateObject("Scripting.FileSystemObject")

dir     = fso.GetParentFolderName(WScript.ScriptFullName)
desktop = shell.SpecialFolders("Desktop")

Set shortcut = shell.CreateShortcut(desktop & "\Stremio Suite.lnk")
shortcut.TargetPath       = "wscript.exe"
shortcut.Arguments        = """" & dir & "\start_servers.vbs"""
shortcut.WorkingDirectory = dir
shortcut.Description      = "Start Stremio Add-on Suite (ports 7000 + 7001)"
shortcut.IconLocation     = "shell32.dll,22"   ' globe/network icon
shortcut.Save

MsgBox "Done! 'Stremio Suite' shortcut added to your Desktop." & vbCrLf & vbCrLf & _
       "You can also drag it to your taskbar to pin it there.", _
       vbInformation, "Stremio Suite"
