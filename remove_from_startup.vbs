
' Removes the Stremio Suite launcher from Windows Startup.

Option Explicit
Dim shell, fso, startupLink

Set shell       = CreateObject("WScript.Shell")
Set fso         = CreateObject("Scripting.FileSystemObject")
startupLink     = shell.SpecialFolders("Startup") & "\Stremio Suite.lnk"

If fso.FileExists(startupLink) Then
    fso.DeleteFile startupLink
    MsgBox "Removed. Stremio Suite will no longer start on login.", vbInformation, "Stremio Suite"
Else
    MsgBox "Nothing to remove — Stremio Suite is not in Startup.", vbExclamation, "Stremio Suite"
End If
