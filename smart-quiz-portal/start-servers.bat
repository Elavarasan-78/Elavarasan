@echo off
title Smart Quiz Portal Servers
echo ===================================================
echo   Starting Smart Quiz Portal Backend & Frontend
echo ===================================================
echo.

echo [1/2] Starting Spring Boot Backend Server...
start "Smart Quiz Backend" cmd /k "cd backend && C:\Users\acer\.m2\wrapper\dists\apache-maven-3.9.16-bin\5grr65jo27hi51sujmtcldfovl\apache-maven-3.9.16\bin\mvn.cmd spring-boot:run"

echo [2/2] Starting React Vite Frontend Server...
start "Smart Quiz Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   Both servers are launching in separate windows!
echo   Frontend: http://localhost:5173/
echo   Backend APIs: http://localhost:8080/swagger-ui/index.html
echo ===================================================
echo.
pause
