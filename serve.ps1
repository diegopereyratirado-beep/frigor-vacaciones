# Supervisor FRIGOR - Control de Vacaciones (modo produccion)
# Mantiene PostgreSQL y la web app (uvicorn 0.0.0.0:8000) siempre corriendo.
# Si el backend se cae, lo relanza automaticamente.

$root = $PSScriptRoot
$pg = "C:\Users\Pereyra\dev-tools\pgsql"
$pgData = "C:\Users\Pereyra\dev-tools\pgdata-frigor"
$python = Join-Path $root "backend\venv\Scripts\python.exe"
$backendDir = Join-Path $root "backend"
$logFile = Join-Path $root "servidor.log"

function Write-Log($msg) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg" | Out-File -FilePath $logFile -Append -Encoding utf8
}

Write-Log "=== Supervisor iniciado ==="

while ($true) {
    # 1. PostgreSQL vivo?
    & "$pg\bin\pg_isready.exe" -h localhost -p 5433 *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Log "PostgreSQL caido; arrancando..."
        & "$pg\bin\pg_ctl.exe" -D $pgData -o "-p 5433" -l "$pgData\pg.log" -w start *> $null
        Start-Sleep -Seconds 3
    }

    # 2. Backend vivo?
    $vivo = $false
    try {
        $r = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8000/api/health" -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $vivo = $true }
    } catch {}

    if (-not $vivo) {
        Write-Log "Web app caida; arrancando uvicorn en 0.0.0.0:8000..."
        Set-Location $backendDir
        # Bloquea aqui mientras el servidor viva; si muere, el bucle lo relanza
        & $python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 *>> $logFile
        Write-Log "uvicorn termino (codigo $LASTEXITCODE); reintento en 5s"
        Start-Sleep -Seconds 5
    } else {
        Start-Sleep -Seconds 20
    }
}
