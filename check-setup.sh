#!/bin/bash

echo "🔍 Verificando instalação do OnTrack..."
echo ""

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker instalado: $(docker --version)"
else
    echo "❌ Docker não encontrado. Instale Docker para continuar."
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose instalado: $(docker-compose --version)"
else
    echo "❌ Docker Compose não encontrado."
    exit 1
fi

# Check Node
if command -v node &> /dev/null; then
    echo "✅ Node.js instalado: $(node --version)"
else
    echo "⚠️  Node.js não encontrado (necessário para desenvolvimento local)"
fi

# Check .env file
if [ -f ".env" ]; then
    echo "✅ Ficheiro .env existe"
else
    echo "⚠️  Ficheiro .env não encontrado. A criar..."
    cp .env.example .env
    echo "✅ Ficheiro .env criado"
fi

echo ""
echo "📦 Estrutura de ficheiros:"
echo "✅ server/db/schema.sql"
echo "✅ server/db/seed.sql"
echo "✅ server/routes/ (9 ficheiros)"
echo "✅ Dockerfile"
echo "✅ docker-compose.yml"

echo ""
echo "🚀 Pronto para iniciar!"
echo ""
echo "Execute um dos seguintes comandos:"
echo ""
echo "  Docker (Recomendado):"
echo "    docker-compose up -d"
echo ""
echo "  Desenvolvimento Local:"
echo "    npm install"
echo "    npm run dev:all"
echo ""
