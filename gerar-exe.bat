@echo off
chcp 65001 > /dev/null
title Gerando instalador ERP...

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   Gerador de Instalador ERP  —  Windows .EXE    ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: Verificar Node.js
node --version > /dev/null 2>&1
if %errorlevel% neq 0 (
    echo  ❌ Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)

:: Instalar dependências
if not exist "node_modules" (
    echo  📦 Instalando dependencias...
    npm install
)

:: Compilar React
echo  🔨 Compilando interface React...
npm run build
if %errorlevel% neq 0 (
    echo  ❌ Erro ao compilar. Verifique os erros acima.
    pause
    exit /b 1
)

:: Gerar instalador Windows
echo.
echo  📦 Gerando instalador Windows (.exe)...
echo     Isso pode levar varios minutos...
echo.
npm run electron:build:win
if %errorlevel% neq 0 (
    echo  ❌ Erro ao gerar instalador.
    pause
    exit /b 1
)

echo.
echo  ✅ Instalador gerado com sucesso!
echo.
echo  Arquivo disponivel em:
echo  release\
echo.
echo  Distribuicao:
echo    - SistemaERPdeGestaoIndustrial Setup 1.0.0.exe  (instalador)
echo    - SistemaERPdeGestaoIndustrial 1.0.0.exe        (portatil)
echo.
start release
pause
