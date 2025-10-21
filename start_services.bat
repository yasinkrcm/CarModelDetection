@echo off
echo Starting Enhanced Car Brand Detection System...

echo.
echo Starting Backend (Django)...
start "Backend" cmd /k "cd backend && python manage.py runserver 8000"

echo.
echo Starting Frontend (Next.js)...
start "Frontend" cmd /k "npm run dev"

echo.
echo Services starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo Demo: http://localhost:3000/demo

echo.
echo Press any key to exit...
pause
