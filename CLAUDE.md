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
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Auth**: JWT com suporte a multi-tenant

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

## 🚀 Próximos Passos

1. **Configurar Prisma** e criar migrações
2. **Implementar rotas de auth** (register, login)
3. **CRUD de clientes** (GET, POST, PATCH, DELETE)
4. **CRUD de produtos** com cálculo automático
5. **Upload de imagens** com Multer
6. **Importação Excel** com ExcelJS
7. **Frontend**: Telas de login, dashboard, formulários

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
