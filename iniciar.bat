@echo off
chcp 65001 > nul
title FabricaERP — Servidor Local

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         FabricaERP  v1.0.0               ║
echo  ║    Sistema de Gestão Industrial           ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Verificar se Node.js está instalado
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo  ❌ ERRO: Node.js não encontrado no seu computador!
    echo.
    echo  Para usar o FabricaERP, você precisa instalar o Node.js:
    echo.
    echo  1. Acesse:  https://nodejs.org
    echo  2. Clique em "Download LTS"
    echo  3. Instale e REINICIE o computador
    echo  4. Execute este arquivo novamente
    echo.
    pause
    exit /b 1
)

:: Verificar se as dependências foram instaladas
if not exist "node_modules" (
    echo  📦 Instalando dependências pela primeira vez...
    echo     Isso pode demorar alguns minutos.
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo  ❌ Erro ao instalar dependências.
        pause
        exit /b 1
    )
    echo.
)

:: Verificar se o sistema foi compilado
if not exist "dist\index.html" (
    echo  🔨 Compilando o sistema pela primeira vez...
    echo     Isso pode demorar alguns minutos.
    echo.
    npm run build
    if %errorlevel% neq 0 (
        echo.
        echo  ❌ Erro ao compilar o sistema.
        pause
        exit /b 1
    )
    echo.
)

:: Iniciar o servidor
echo  🚀 Iniciando servidor...
echo.
node server/index.js

pause
