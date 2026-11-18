# Installs the Scree desktop pet on Windows and starts it with Windows.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
py -m pip install --user -r "$here\requirements.txt"
$pyw = (Get-Command pyw).Source
$lnk = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Scree.lnk"
$sc = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
$sc.TargetPath = $pyw
$sc.Arguments = '"' + "$here\scree_desktop.py" + '"'
$sc.WorkingDirectory = $here
$sc.Save()
Start-Process $pyw -ArgumentList ('"' + "$here\scree_desktop.py" + '"')
Write-Host "Scree is on your desktop and will start with Windows."
