@echo off
echo Starting RiskSentinel Backend on http://127.0.0.1:8000
echo Press CTRL+C to stop
cd /d "%~dp0\backend"
"%~dp0\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level info --reload