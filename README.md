# OnTrack Audit Application

Sistema de gestão de auditorias e visitas para lojas Intermarché/Bricomarché.

## 🚀 Início Rápido com Docker

### Pré-requisitos
- Docker
- Docker Compose

### Executar com Docker Compose

1. Inicie os serviços
```bash
docker-compose up -d
```

2. Aceda à aplicação em `http://localhost:3001`

### Parar os serviços
```bash
docker-compose down
```

### Parar e limpar dados (reset completo)
```bash
docker-compose down -v
```

## 🛠️ Desenvolvimento Local

### Pré-requisitos
- Node.js 20+
- PostgreSQL 15+

### Configuração

1. Instalar dependências
```bash
npm install
```

2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

3. Criar base de dados
```bash
psql -U postgres -c "CREATE DATABASE ontrack_db;"
psql -U postgres -d ontrack_db -f server/db/schema.sql
psql -U postgres -d ontrack_db -f server/db/seed.sql
```

4. Iniciar desenvolvimento
```bash
npm run dev:all
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001

## 🔑 Utilizadores de Teste

| Email | Role |
|-------|------|
| admin@mousquetaires.com | ADMIN |
| amont@mousquetaires.com | AMONT |
| dot1@mousquetaires.com | DOT |
| aderente1@intermarche.pt | ADERENTE |

## 📝 Licença

Proprietário - Mousquetaires Portugal
