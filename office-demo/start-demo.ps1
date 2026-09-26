param([int]$Port = 4173)
$ErrorActionPreference = 'Stop'
$officeRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (-not (Test-Path -LiteralPath $officeRuntime)) {
    $officeRuntime = (Get-Command node -ErrorAction Stop).Source
}
Push-Location $PSScriptRoot
try {
    & $officeRuntime 'node_modules/vite/bin/vite.js' --host 127.0.0.1 --port $Port --strictPort
} finally {
    Pop-Location
}
