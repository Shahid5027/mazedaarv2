# Run EDUCORE AI Backend Server
Set-Location -Path $PSScriptRoot
$env:PYTHONPATH = "backend"
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Starting EDUCORE AI Backend Server on http://localhost:8000" -ForegroundColor Green
Write-Host "API Swagger Documentation at http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
& ".\backend\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

