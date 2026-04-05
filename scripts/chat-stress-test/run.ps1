# GuideFlow Stress Test — Launcher para PowerShell
# Uso: .\run.ps1 [argumentos de run-stress-test.ts]
# Ejemplo: .\run.ps1 --category wifi --no-eval

param (
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Args
)

$envFile = Join-Path $PSScriptRoot "..\..\.env.stress"
if (-not (Test-Path $envFile)) {
    Write-Error "No se encontro $envFile. Crea el archivo desde .env.stress.example"
    exit 1
}

# Cargar variables del .env.stress
Get-Content $envFile | Where-Object { $_ -notmatch '^#' -and $_ -match '=' } | ForEach-Object {
    $k, $v = $_ -split '=', 2
    $key = $k.Trim()
    $value = $v.Trim()
    Set-Item "env:$key" $value
}

Write-Host "Variables cargadas desde env.stress" -ForegroundColor Green

# Ejecutar segun argumento
$script = if ($Args -contains "fetch") { "fetch-properties.ts" } else { "run-stress-test.ts" }
$passArgs = $Args | Where-Object { $_ -ne "fetch" }

Write-Host "Ejecutando: npx tsx $script $passArgs" -ForegroundColor Cyan
npx tsx "$PSScriptRoot\$script" @passArgs
