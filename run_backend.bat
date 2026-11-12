@echo off
cd /d "%~dp0"
echo ================================================================
echo Starting EDUCORE AI Backend Server (FastAPI) on http://localhost:8000
echo ================================================================
set PYTHONPATH=backend
backend\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause

