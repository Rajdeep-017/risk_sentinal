# RiskSentinel Backend Startup Script
Write-Host "Starting RiskSentinel Backend..." -ForegroundColor Green
Set-Location "$PSScriptRoot\backend"
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000