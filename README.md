# Menu Manager 🍽️

[![CI - Build & Test](https://github.com/antonioalves-novarotamkt/novarota-pdv/actions/workflows/ci.yml/badge.svg)](https://github.com/antonioalves-novarotamkt/novarota-pdv/actions/workflows/ci.yml)
[![Deploy Preview](https://github.com/antonioalves-novarotamkt/novarota-pdv/actions/workflows/deploy-preview.yml/badge.svg)](https://github.com/antonioalves-novarotamkt/novarota-pdv/actions/workflows/deploy-preview.yml)

Sistema web completo de gerenciamento de cardápios com:
- ✅ Precificação automática com cálculo de margem
- ✅ Multi-tenant (múltiplos clientes por usuário)
- ✅ Autenticação JWT segura
- ✅ API REST com Prisma
- ✅ Frontend React moderno
- ✅ CI/CD com GitHub Actions

## Funcionalidades

✅ **Gestão Multi-Tenant** - Cada cliente tem seu próprio workspace  
✅ **Cardápio** - Produtos com descrição, fotos e categorias  
✅ **Precificação Inteligente** - Cálculo automático com margem configurável  
✅ **Canais de Venda** - Precificação diferenciada por canal (loja, iFood, Uber, etc)  
✅ **Importar/Exportar Excel** - XLSX com suporte a imagens em lote  
✅ **Gestão de Imagens** - Upload e sincronização de fotos  
✅ **API REST** - Consumida por apps terceiros (PDV, site, etc)  
✅ **Autenticação** - JWT com suporte a workspaces  

## Stack

### Backend
- Node.js 20+
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL / SQLite
- JWT Authentication
- Multer (upload de arquivos)
- ExcelJS (import/export)

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Query
- React Hook Form
- Zustand (state management)

### Shared
- TypeScript types compartilhadas entre backend e frontend

## Desenvolvimento

### Instalação

```bash
npm install
```

### Rodando localmente

```bash
npm run dev
```

Abre:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### Variáveis de Ambiente

Crie `.env` no diretório `backend/`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-aqui"
NODE_ENV="development"
PORT=3000
```

### Banco de Dados

```bash
# Criar/migrar schema
npm run db:migrate

# Ver dados (Prisma Studio)
npm run db:studio
```

## Estrutura de Pastas

```
├── backend/
│   ├── src/
│   │   ├── main.ts           # Entrada
│   │   ├── app.ts            # Configuração Express
│   │   ├── routes/           # Rotas da API
│   │   ├── controllers/      # Controladores
│   │   ├── services/         # Lógica de negócio
│   │   ├── middleware/       # Autenticação, validação
│   │   ├── db/               # Prisma + seeders
│   │   └── utils/            # Helpers, Excel, validação
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # Entrada React
│   │   ├── App.tsx
│   │   ├── pages/            # Telas
│   │   ├── components/       # Componentes
│   │   ├── hooks/            # Custom hooks
│   │   ├── store/            # Zustand stores
│   │   ├── services/         # API client
│   │   └── types/            # Tipos TS
│   └── package.json
├── shared/
│   ├── types.ts              # Tipos compartilhados
│   └── package.json
└── README.md
```

## API Endpoints (Preview)

### Auth
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Clientes (Multi-tenant)
- `GET /api/clients` - Listar meus clientes
- `POST /api/clients` - Criar cliente
- `GET /api/clients/:id` - Detalhes
- `PATCH /api/clients/:id` - Atualizar
- `DELETE /api/clients/:id` - Deletar

### Produtos
- `GET /api/clients/:clientId/products` - Listar
- `POST /api/clients/:clientId/products` - Criar
- `PATCH /api/clients/:clientId/products/:id` - Atualizar
- `DELETE /api/clients/:clientId/products/:id` - Deletar

### Importar/Exportar
- `POST /api/clients/:clientId/import/excel` - Importar Excel
- `GET /api/clients/:clientId/export/excel` - Exportar Excel

### Imagens
- `POST /api/clients/:clientId/images` - Upload
- `GET /api/clients/:clientId/images/:id` - Download

## Próximos Passos

1. Configurar banco de dados (Prisma + SQLite/PostgreSQL)
2. Implementar autenticação JWT
3. CRUD de clientes e produtos
4. Cálculo de preços com margem
5. Upload de imagens
6. Importação/exportação Excel
7. API de canais de venda
8. Frontend React com autenticação

## Deploy

### Vercel (recomendado)
- Backend (serverless)
- Frontend (edge)

### Self-hosted
- Docker + Docker Compose
- Railway, Render, ou outro VPS

---

Criado com ❤️ para gerenciar cardápios com inteligência.
