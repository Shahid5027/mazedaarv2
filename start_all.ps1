# Launch Both Backend and Frontend in separate windows
Set-Location -Path $PSScriptRoot
Write-Host "Launching EDUCORE AI full-stack platform..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-File `"$PSScriptRoot\run_backend.ps1`""
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-File `"$PSScriptRoot\run_frontend.ps1`""

Write-Host "Services started:" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000 (Docs: http://localhost:8000/docs)" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Yellow

