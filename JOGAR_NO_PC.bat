@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js nao foi encontrado neste computador.
  echo Instale o Node.js 22 ou superior e execute este arquivo novamente.
  echo.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias na primeira execucao...
  call npm install
  if errorlevel 1 (
    echo Falha ao instalar as dependencias.
    pause
    exit /b 1
  )
)
echo.
echo Crônicas da Guilda sera aberto em http://localhost:4173
start "" http://localhost:4173
call npm run dev -- --host 127.0.0.1 --port 4173
