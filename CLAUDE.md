# Menu Manager - Documentação de Desenvolvimento

## 📋 Visão Geral

**Menu Manager** é um sistema web para gerenciamento de cardápios com:
- Precificação automática com cálculo de margem
- Suporte a múltiplos clientes (multi-tenant)
- Importação/exportação Excel
- Gerenciamento de imagens de produtos
- Canais de venda personalizados (loja, iFood, Uber, etc)

## 🏗️ Arquitetura

### Stack
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Database**: PostgreSQL (dev e prod — via `docker compose up postgres` localmente)
- **Auth**: JWT com suporte a multi-tenant
- **Deploy**: Railway (backend + Postgres) + Vercel (frontend) — veja `DEPLOY.md`

### Detalhes importantes de runtime
- O backend usa ESM (`"type": "module"`): todo import relativo no código-fonte
  precisa terminar em `.js` (mesmo apontando para um arquivo `.ts`), senão o
  Node não resolve o módulo em produção (`ERR_MODULE_NOT_FOUND`). O `tsc` não
  adiciona isso sozinho.
- Os scripts `dev` e `seed` usam `node --env-file=.env --import tsx` (não
  `--loader tsx`, que está deprecated a partir do Node 20.6/22 e quebra
  silenciosamente combinado com `--env-file`).
- `npm run start` (produção) roda `prisma migrate deploy` antes de subir o
  servidor — não usa `migrate dev` (que é interativo).

### Estrutura
```
backend/        # API Express + Prisma
├── src/
│   ├── main.ts           # Entrada
│   ├── app.ts            # Configuração Express
│   ├── routes/           # Rotas (não implementado)
│   ├── controllers/      # Controladores (não implementado)
│   ├── services/         # Lógica de negócio (não implementado)
│   ├── middleware/       # Auth, validação (não implementado)
│   └── db/               # Prisma schema + seeders
│
frontend/       # App React
├── src/
│   ├── components/       # Componentes React
│   ├── pages/           # Páginas/telas
│   ├── hooks/           # Custom hooks
│   ├── store/           # Zustand stores
│   ├── services/        # API client
│   └── types/           # Types locais
│
shared/         # Tipos compartilhados
└── src/
    └── types.ts         # Interfaces de dados
```

## 🗄️ Schema Prisma

### Modelos Principais

**User** - Admin do sistema
- id, email (unique), password, name
- Relacionado com múltiplos Clients

**Client** - Tenant/Cliente/Loja
- id, name, slug (unique), email, phone, logo
- Contém: Products, Categories, SalesChannels, Images

**Product** - Item do cardápio
- name, description, sku, basePrice, markup, finalPrice
- finalPrice é calculado: basePrice * (1 + markup/100)

**Category** - Categorias do cardápio
- name, icon, order

**ProductImage** - Fotos dos produtos
- url, order (para múltiplas fotos por produto)

**SalesChannel** - Canais (Loja, iFood, Uber, etc)
- name, icon, order

**ChannelPrice** - Preços customizados por canal
- price, extraMarkup (markup adicional além do padrão)

## 🔐 Autenticação

- JWT com tokens de acesso e refresh
- Suporte a multi-tenant: cada usuário pode gerenciar múltiplos clientes
- Middleware de autenticação (não implementado)

## ✅ Funcionalidades Planejadas

### Fase 1: Autenticação e CRUD Base
- [ ] Autenticação JWT (register, login, refresh)
- [ ] CRUD de Clientes
- [ ] CRUD de Produtos com cálculo de preço
- [ ] CRUD de Categorias
- [ ] Upload de imagens

### Fase 2: Importação/Exportação
- [ ] Importar Excel com produtos em lote
- [ ] Exportar cardápio em Excel
- [ ] Sincronização de imagens

### Fase 3: Canais de Venda
- [ ] CRUD de Sales Channels
- [ ] Precificação por canal
- [ ] API para consumo (PDV, site, etc)

### Fase 4: Dashboard e Relatórios
- [ ] Dashboard com estatísticas
- [ ] Relatório de produtos
- [ ] Sincronização em tempo real

## 🚀 Rodando o Projeto

### Setup Inicial
```bash
# Instalar dependências
npm install

# Configurar banco de dados e seed
npm run db:setup

# Ou separadamente:
npm run db:migrate  # Criar tabelas
npm run db:seed     # Popular com dados demo
```

### Desenvolvimento
```bash
# Rodar backend e frontend simultaneamente
npm run dev

# Ou separadamente:
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3000

### Credenciais Demo
- **Email**: demo@example.com
- **Senha**: demo123

## ✅ Implementado

- [x] Autenticação JWT (register, login)
- [x] CRUD de clientes (multi-tenant)
- [x] CRUD de produtos com cálculo automático de preço
- [x] Frontend: Login, Dashboard, Detalhes do Cliente, Formulário de Produtos
- [x] API client TypeScript com Axios
- [x] Zustand store para autenticação
- [x] Prisma schema com relacionamentos
- [x] Seeder com dados demo
- [x] Importação/exportação Excel (`backend/src/services/excel.service.ts`)
  - `GET /api/clients/:clientId/export/excel` (`?template=1` baixa o modelo com a aba de instruções)
  - `POST /api/clients/:clientId/import/excel` (multipart, campo `file`, até 5 MB, .xlsx)
  - Tudo ou nada: se uma linha tiver erro, nada é gravado e a resposta traz `details: [{row, message}]`
  - Correspondência: pelo Código (SKU) quando preenchido, senão pelo nome. Célula vazia de SKU não apaga o código existente
  - O SKU é único por cliente (`@@unique([clientId, sku])`), não no sistema inteiro

## 📋 Próximos Passos

1. **Upload de imagens** com Multer
2. **Canais de venda** - precificação diferenciada por canal
3. **Categorias** - CRUD e organização de produtos
4. **Dashboard** com estatísticas
5. **Relatórios** de vendas

## 📝 Convenções de Código

- Nomes em inglês para código
- Rotas RESTful: `/api/clients/:clientId/products`
- Tipos compartilhados em `shared/src/types.ts`
- Middleware de autenticação em `backend/src/middleware/`
- Serviços de negócio em `backend/src/services/`

## 🔄 Fluxo Multi-Tenant

1. Usuário faz login
2. Backend retorna JWT com userId
3. Cliente (workspace) escolhe qual cliente (slug) quer trabalhar
4. Frontend armazena clientId em sessão/localStorage
5. Todas as requisições incluem `clientId` na URL ou headers
6. Backend valida que o usuário tem acesso ao cliente

## 💡 Notas Importantes

- Não esquecer de validar que usuário tem acesso ao cliente nas rotas
- Preciso de CORS configurado para desenvolvimento (frontend em 5173, backend em 3000)
- Multer para uploads precisa de uma pasta `uploads/` configurable
- ExcelJS para importação deve validar as colunas obrigatórias
