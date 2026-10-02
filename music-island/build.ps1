param([switch]$Test)
$ErrorActionPreference = 'Stop'
$taskBuilder = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe'
if (-not (Test-Path -LiteralPath $taskBuilder)) {
  $taskBuilder = (Get-Command MSBuild.exe -ErrorAction Stop).Source
}
& $taskBuilder (Join-Path $PSScriptRoot 'Ostrov.csproj') /nologo /verbosity:minimal /p:Configuration=Release
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
if ($Test) {
  $taskReport = Join-Path $PSScriptRoot '.qa\self-test.txt'
  New-Item -ItemType Directory -Path (Split-Path $taskReport) -Force | Out-Null
  $taskProcess = Start-Process -FilePath (Join-Path $PSScriptRoot 'bin\Release\Ostrov.exe') -ArgumentList @('--self-test', ('"' + $taskReport + '"')) -WindowStyle Hidden -PassThru -Wait
  if (Test-Path -LiteralPath $taskReport) { Get-Content -LiteralPath $taskReport }
  if ($taskProcess.ExitCode -ne 0) { throw 'Self-test failed.' }
}
