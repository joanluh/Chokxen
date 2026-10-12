@echo off
cd /d "%~dp0"
docker compose config --quiet
if errorlevel 1 (
  echo Revisa Docker Desktop y la configuracion del frontend.
  pause
  exit /b 1
)
docker compose up -d --build
if errorlevel 1 (
  echo No se pudo iniciar el contenedor. Revisa el error anterior.
  pause
  exit /b 1
)
docker compose ps
echo SPA disponible en http://localhost:5173 con el puerto por defecto.
pause
