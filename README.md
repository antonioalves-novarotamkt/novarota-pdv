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
- PostgreSQL
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

Crie `.env` no diretório `backend/` (veja `backend/.env.example`):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/menumanager"
JWT_SECRET="sua-chave-secreta-aqui"
NODE_ENV="development"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

Precisa de um PostgreSQL rodando localmente. A forma mais simples é via Docker:
```bash
docker compose up postgres -d
```

### Banco de Dados

```bash
# Criar/migrar schema + popular com dados demo
npm run db:setup

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

1. Upload de imagens
2. Importação/exportação Excel
3. API de canais de venda com precificação diferenciada
4. Dashboard com estatísticas

## Deploy

Veja o guia passo a passo completo em [DEPLOY.md](./DEPLOY.md).

Resumo:
- **Backend + PostgreSQL**: Railway (usa o `Dockerfile` da raiz)
- **Frontend**: Vercel (usa `frontend/vercel.json`)

---

Criado com ❤️ para gerenciar cardápios com inteligência.
