param()
$ROOT    = $PSScriptRoot
$PYTHON  = "$ROOT\.venv\Scripts\python.exe"
$WEB     = "$ROOT\web"
$DB_PATH = "$ROOT\data\lakehouse\silver\audittrace.duckdb"

function Write-Step { param($m) Write-Host "" ; Write-Host "  >> $m" -ForegroundColor Cyan }
function Write-OK   { param($m) Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "  [!!] $m" -ForegroundColor Yellow }
function Write-Err  { param($m) Write-Host "  [ERROR] $m" -ForegroundColor Red }
function Write-Info { param($m) Write-Host "        $m" -ForegroundColor DarkGray }

Clear-Host
Write-Host ""
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host "      AuditTrace Financial Surveillance Platform   " -ForegroundColor Cyan
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host ""

# --- 0. Pre-flight ---
Write-Step "Pre-flight checks..."
if (-not (Test-Path $PYTHON)) { Write-Err "Python venv not found. Run: python -m venv .venv && pip install -r requirements.txt"; Read-Host; exit 1 }
Write-OK "Python venv OK"
if (-not (Test-Path "$WEB\node_modules")) {
    Write-Warn "node_modules missing. Installing (this may take 2 minutes)..."
    Push-Location $WEB; npm install --legacy-peer-deps; Pop-Location
}
Write-OK "Node modules OK"

# --- 1. Kill stale processes on ports ---
Write-Step "Freeing ports 8000 and 5173..."
foreach ($port in @(8000, 5173)) {
    $pids = netstat -aon 2>$null | Select-String ":$port " | ForEach-Object { ($_ -split '\s+')[-1] } | Where-Object { $_ -match '^\d+$' } | Sort-Object -Unique
    foreach ($p in $pids) { try { Stop-Process -Id ([int]$p) -Force -ErrorAction SilentlyContinue; Write-Info "Killed PID $p (was on :$port)" } catch {} }
}
Write-OK "Ports cleared"
New-Item -ItemType Directory -Path "$ROOT\logs" -Force | Out-Null

# --- 2. Regenerate data if missing or old ---
Write-Step "Checking lakehouse data..."
$needsRegen = $false
if (-not (Test-Path $DB_PATH)) {
    Write-Warn "DuckDB not found. Running full pipeline..."
    $needsRegen = $true
} else {
    $ageM = [int]((Get-Date) - (Get-Item $DB_PATH).LastWriteTime).TotalMinutes
    if ($ageM -gt 1440) { Write-Warn "Data is ${ageM}min old. Refreshing..."; $needsRegen = $true }
    else { Write-OK "Lakehouse data fresh (${ageM} min old)" }
}
if ($needsRegen) {
    Write-Info "Generating 2500 synthetic financial transactions..."
    & $PYTHON "$ROOT\run_pipeline.py" --events 2500
    if ($LASTEXITCODE -ne 0) { Write-Err "Pipeline failed! Check the output above."; Read-Host "Press Enter to exit"; exit 1 }
    Write-OK "Bronze / Silver / Gold all populated"
}

# --- 3. Build React if dist missing ---
Write-Step "Checking React build..."
if (-not (Test-Path "$WEB\dist\index.html")) {
    Write-Warn "No production build found. Building (~20s)..."
    Push-Location $WEB; npm run build; Pop-Location
    if ($LASTEXITCODE -ne 0) { Write-Err "React build failed!"; Read-Host "Press Enter to exit"; exit 1 }
    Write-OK "Build successful"
} else {
    $ageM = [int]((Get-Date) - (Get-Item "$WEB\dist\index.html").LastWriteTime).TotalMinutes
    Write-OK "Build OK (${ageM} min old)"
}

# --- 4. Start FastAPI as detached process ---
Write-Step "Starting FastAPI Analytical Gateway (port 8000)..."
$apiProc = Start-Process -FilePath $PYTHON -ArgumentList "$ROOT\api.py" -WorkingDirectory $ROOT -RedirectStandardOutput "$ROOT\logs\api.log" -RedirectStandardError "$ROOT\logs\api_err.log" -PassThru -WindowStyle Hidden
Write-Info "FastAPI PID: $($apiProc.Id)"

# Wait for FastAPI health check (up to 20s)
$apiReady = $false
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $r = Invoke-WebRequest "http://localhost:8000/api/v1/metrics/kpis" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $apiReady = $true; break }
    } catch {}
}
if ($apiReady) { Write-OK "FastAPI LIVE @ http://localhost:8000 (PID $($apiProc.Id))" }
else { Write-Err "FastAPI didn't respond after 20s. Log: $ROOT\logs\api_err.log" }

# --- 5. Start Vite dev server as detached process ---
Write-Step "Starting React Dashboard (port 5173)..."
$npmPath = (Get-Command npm -ErrorAction SilentlyContinue).Source
if (-not $npmPath) { $npmPath = "npm" }
$webProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $WEB -RedirectStandardOutput "$ROOT\logs\web.log" -RedirectStandardError "$ROOT\logs\web_err.log" -PassThru -WindowStyle Hidden
Write-Info "Vite PID: $($webProc.Id)"

# Wait for Vite health check (up to 20s)
$webReady = $false
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 500
    try {
        $r = Invoke-WebRequest "http://localhost:5173" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $webReady = $true; break }
    } catch {}
}
if ($webReady) { Write-OK "React Dashboard LIVE @ http://localhost:5173 (PID $($webProc.Id))" }
else { Write-Err "React didn't respond after 20s. Log: $ROOT\logs\web_err.log" }

# Save PIDs so they can be killed later
"$($apiProc.Id),$($webProc.Id)" | Set-Content "$ROOT\logs\.pids"

# --- 6. Open browser ---
if ($webReady -or $apiReady) {
    Start-Sleep -Seconds 1
    Start-Process "http://localhost:5173"
}

# --- 7. Summary ---
Write-Host ""
Write-Host "  ================================================" -ForegroundColor Green
Write-Host "  Dashboard   : http://localhost:5173" -ForegroundColor Green
Write-Host "  API         : http://localhost:8000" -ForegroundColor Green
Write-Host "  API Docs    : http://localhost:8000/docs" -ForegroundColor Green
Write-Host "  Logs folder : $ROOT\logs\" -ForegroundColor DarkGray
Write-Host "  Stop cmd    : Stop-Process -Id (cat logs\.pids).Split(',') -Force" -ForegroundColor DarkGray
Write-Host "  ================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Both servers are running in the background." -ForegroundColor Cyan
Write-Host "  Close this window or press Enter to exit." -ForegroundColor DarkGray
Read-Host
