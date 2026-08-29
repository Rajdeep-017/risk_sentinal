@echo off
cd /d "D:\Razorpay project\backend"
"D:\Razorpay project\venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --log-level info