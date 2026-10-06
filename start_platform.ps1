# AuditTrace Platform Launcher
# Starts FastAPI (port 8000) + Vite dev server (port 5173) simultaneously

Write-Host "`nAuditTrace Platform" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Starting FastAPI Lakehouse API on http://localhost:8000" -ForegroundColor Green
Write-Host "Starting React Dashboard on http://localhost:5173" -ForegroundColor Green
Write-Host "`nPress Ctrl+C in each terminal window to stop.`n" -ForegroundColor Yellow

# Start FastAPI in a new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    Set-Location 'D:\Projects\audittrace-lakehouse';
    Write-Host 'FastAPI API Gateway' -ForegroundColor Cyan;
    Write-Host 'Docs: http://localhost:8000/docs' -ForegroundColor Yellow;
    .\.venv\Scripts\python.exe api.py
"

Start-Sleep -Seconds 2

# Start Vite dev server in another terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
    Set-Location 'D:\Projects\audittrace-lakehouse\web';
    Write-Host 'React Dashboard' -ForegroundColor Cyan;
    Write-Host 'Open: http://localhost:5173' -ForegroundColor Yellow;
    npm run dev
"

Write-Host "Both servers launching..." -ForegroundColor Green
Write-Host "Open http://localhost:5173 in your browser after ~3s" -ForegroundColor Cyan
