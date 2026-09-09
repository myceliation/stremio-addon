
' Adds the Stremio Suite launcher to Windows Startup so it runs on every login.
' Double-click once to enable. Run remove_from_startup.vbs to undo.

Option Explicit
Dim shell, fso, dir, shortcut, startupDir

Set shell      = CreateObject("WScript.Shell")
Set fso        = CreateObject("Scripting.FileSystemObject")

dir        = fso.GetParentFolderName(WScript.ScriptFullName)
startupDir = shell.SpecialFolders("Startup")   ' %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

Set shortcut = shell.CreateShortcut(startupDir & "\Stremio Suite.lnk")
shortcut.TargetPath       = "wscript.exe"
shortcut.Arguments        = """" & dir & "\start_servers.vbs"""
shortcut.WorkingDirectory = dir
shortcut.Description      = "Start Stremio Add-on Suite (ports 7000 + 7001)"
shortcut.IconLocation     = "shell32.dll,22"
shortcut.Save

MsgBox "Done! Stremio Suite will now start automatically on every login." & vbCrLf & vbCrLf & _
       "To stop auto-starting, run remove_from_startup.vbs.", _
       vbInformation, "Stremio Suite — Startup"
