' Stremio Silent Launcher
Option Explicit

Dim shell, fso, dir
Set shell = CreateObject("WScript.Shell")
Set fso   = CreateObject("Scripting.FileSystemObject")

dir = fso.GetParentFolderName(WScript.ScriptFullName)

shell.Run "cmd /c " & Chr(34) & dir & "\_launch.bat" & Chr(34), 0, True
