@echo off
cd /d "%~dp0"
echo ================================================================
echo Launching EDUCORE AI (Backend on 8000 + Frontend on 3000)
echo ================================================================
start "EDUCORE AI - Backend" cmd /k "run_backend.bat"
timeout /t 3 /nobreak >nul
start "EDUCORE AI - Frontend" cmd /k "run_frontend.bat"
echo Both servers initiated!
echo Backend Docs: http://localhost:8000/docs
echo Frontend App: http://localhost:3000
pause

