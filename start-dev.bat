
@echo off
echo Installing dependencies...
call npm install

echo Starting the application...
start /B cmd /c "npm run dev"

echo Application started! Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5000
