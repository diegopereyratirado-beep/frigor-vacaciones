# Arranque completo del sistema FRIGOR - Control de Vacaciones
# Levanta: PostgreSQL portable (5433) + FastAPI (8000) + Vite (5173)

$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$pg = "C:\Users\Pereyra\dev-tools\pgsql"
$pgData = "C:\Users\Pereyra\dev-tools\pgdata-frigor"
$node = "C:\Users\Pereyra\dev-tools\node-v22.14.0-win-x64"
$pyVenv = Join-Path $root "backend\venv\Scripts\python.exe"

# --- 1. PostgreSQL ---
if (-not (Test-Path "$pgData\PG_VERSION")) {
    Write-Host "Inicializando cluster PostgreSQL..." -ForegroundColor Yellow
    $pwFile = "$env:TEMP\pgpw.txt"
    Set-Content -Path $pwFile -Value "frigor2026" -Encoding ascii
    & "$pg\bin\initdb.exe" -D $pgData -U postgres --pwfile=$pwFile -E UTF8 -A scram-sha-256 | Out-Null
    Remove-Item $pwFile
}

$running = & "$pg\bin\pg_ctl.exe" -D $pgData status 2>$null | Select-String "server is running"
if (-not $running) {
    Write-Host "Arrancando PostgreSQL en puerto 5433..." -ForegroundColor Yellow
    & "$pg\bin\pg_ctl.exe" -D $pgData -o "-p 5433" -l "$pgData\pg.log" -w start | Out-Null
}

# Crear la base si no existe
$env:PGPASSWORD = "frigor2026"
$exists = & "$pg\bin\psql.exe" -h localhost -p 5433 -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='frigor_vacaciones'" 2>$null
if ($exists -ne "1") {
    Write-Host "Creando base de datos frigor_vacaciones..." -ForegroundColor Yellow
    & "$pg\bin\createdb.exe" -h localhost -p 5433 -U postgres frigor_vacaciones
}

# --- 2. Seed (idempotente) ---
Push-Location (Join-Path $root "backend")
& $pyVenv -m app.seed
Pop-Location

# --- 3. Backend ---
Write-Host "Arrancando backend FastAPI en http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process -FilePath $pyVenv -ArgumentList "-m", "uvicorn", "app.main:app", "--port", "8000" -WorkingDirectory (Join-Path $root "backend") -WindowStyle Minimized

# --- 4. Frontend ---
Write-Host "Arrancando frontend Vite en http://localhost:5173 ..." -ForegroundColor Yellow
$env:Path = "$node;$env:Path"
Start-Process -FilePath "$node\npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory (Join-Path $root "frontend") -WindowStyle Minimized

Write-Host ""
Write-Host "=== FRIGOR Control de Vacaciones ===" -ForegroundColor Red
Write-Host "Frontend : http://localhost:5173"
Write-Host "API docs : http://localhost:8000/docs"
Write-Host "Admin    : admin / admin123"
Write-Host "Empleado : carlosmendoza / 1234"
