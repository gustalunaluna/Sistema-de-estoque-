#!/bin/bash
echo ""
echo " ╔══════════════════════════════════════════╗"
echo " ║         FabricaERP  v1.0.0               ║"
echo " ║    Sistema de Gestão Industrial           ║"
echo " ╚══════════════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo " ❌ ERRO: Node.js não encontrado!"
    echo ""
    echo " Instale o Node.js:"
    echo "   Ubuntu/Debian: sudo apt install nodejs npm"
    echo "   Mac:           https://nodejs.org"
    echo ""
    exit 1
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo " 📦 Instalando dependências..."
    npm install
fi

# Compilar se necessário
if [ ! -f "dist/index.html" ]; then
    echo " 🔨 Compilando o sistema..."
    npm run build
fi

echo " 🚀 Iniciando servidor..."
echo ""
node server/index.js
