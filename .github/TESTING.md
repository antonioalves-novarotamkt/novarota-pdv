# 🧪 Guia de Testes - Menu Manager

## CI/CD Automatizado

Este projeto utiliza **GitHub Actions** para testes automatizados em cada push/PR:

### ✅ Testes Executados

1. **TypeScript Type Check** - Validação de tipos em backend e frontend
2. **Build** - Compilação de backend e frontend
3. **Prisma Schema** - Validação do schema do banco de dados
4. **Security Audit** - Verificação de vulnerabilidades npm

### 📊 Workflows

#### `ci.yml` - Continuous Integration
Executa a cada push e PR:
- Instala dependências
- TypeScript check (backend + frontend)
- Build de ambos os pacotes
- Validação do Prisma schema
- Npm audit para segurança

**Status**: Ver badge no README ou na aba Actions

#### `deploy-preview.yml` - Build & Deploy
Prepara artefatos para deploy:
- Build otimizado
- Upload de artefatos
- Docker image (opcional)

## 🧪 Testes Manuais

### Setup Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar banco de dados
npm run db:setup

# 3. Rodar em desenvolvimento
npm run dev
```

### Testes Funcionais

#### 1. Autenticação
```
✓ Login - Entrar com credenciais
✓ Session Restore - Manter sessão ao recarregar
✓ Logout - Limpar tokens e redirecionar para login
```

**Como testar:**
- Ir para http://localhost:5173/login
- Usar as credenciais demo do seed local (demo@example.com / demo123)

#### 2. Clientes
```
✓ List - GET /api/clients
✓ Create - POST /api/clients
✓ Read - GET /api/clients/:clientId
✓ Update - PATCH /api/clients/:clientId
✓ Delete - DELETE /api/clients/:clientId
✓ Multi-tenant - Usuário só vê seus clientes
```

**Como testar:**
- Dashboard mostra clientes do usuário
- Botão "+ Novo Cliente" cria cliente
- Clicar no cliente abre detalhes
- Falta: UI para editar/deletar cliente (implementar)

#### 3. Produtos
```
✓ List - GET /api/clients/:clientId/products
✓ Create - POST /api/clients/:clientId/products
✓ Read - GET /api/clients/:clientId/products/:productId
✓ Update - PATCH /api/clients/:clientId/products/:productId
✓ Delete - DELETE /api/clients/:clientId/products/:productId
✓ Precificação - Cálculo automático finalPrice
```

**Como testar:**
- Entrar em um cliente
- Clicar "+ Novo Produto"
- Preencher:
  - Nome: "Pizza Calabresa"
  - Preço Base: 30.00
  - Margem: 40%
- **Verificar**: Preço Final = 42.00 (30 × 1.40)
- Editar e deletar produtos

#### 4. Precificação (Principal)
```javascript
// Teste de Cálculo
basePrice: 100.00
markup: 20%
finalPrice: 120.00 ✓

basePrice: 50.00
markup: 50%
finalPrice: 75.00 ✓

basePrice: 25.00
markup: 30%
finalPrice: 32.50 ✓
```

**Como testar:**
- No formulário de produto, alterar margem
- Ver preço final atualizar em tempo real
- Criar produto e verificar finalPrice no banco

## 🔒 Testes de Segurança

### Middleware de Autenticação
```bash
# Teste: Tentar acessar /api/clients sem token
curl http://localhost:3000/api/clients
# Esperado: 401 Unauthorized

# Teste: Com token inválido
curl -H "Authorization: Bearer invalid" http://localhost:3000/api/clients
# Esperado: 401 Invalid token
```

### Controle de Acesso (Multi-tenant)
```bash
# Teste: Usuário A tenta acessar cliente de Usuário B
# Esperado: 403 Forbidden
```

### Senhas
```bash
# Teste: Usar login com senha correta
# Esperado: Login sucesso

# Teste: Usar login com senha incorreta
# Esperado: 401 Invalid password
```

## 📈 Performance

### Métricas a Monitorar
- Build time (deve ser < 30s)
- Bundle size (frontend)
- API response time (< 100ms)

### Como Verificar
```bash
# Build time
time npm run build

# Bundle size
npm run build -w frontend
ls -lh frontend/dist/
```

## 🚀 Deploy Preview

Quando há PR:
1. GitHub Actions roda testes automaticamente
2. Se tudo passar, se pronto para fazer merge
3. Deploy preview pode ser criado (Vercel, Netlify)

### Vercel Deploy
```bash
# Configurar Vercel
vercel link

# Deploy backend
vercel --cwd backend

# Deploy frontend  
vercel --cwd frontend
```

## ✅ Checklist de Testes Antes do Merge

- [ ] CI passou (verde no GitHub Actions)
- [ ] Nenhum erro TypeScript
- [ ] Build passou
- [ ] Teste manual de autenticação
- [ ] Teste manual de CRUD de produtos
- [ ] Teste de precificação (principal feature)
- [ ] Teste de multi-tenant (usuário não vê cliente de outro)
- [ ] Nenhuma secret vaza no commit

## 🐛 Debugar Testes Falhados

### No GitHub Actions
1. Ir para `Actions` → workflow falhado
2. Clicar em `Logs` para ver erro
3. Procurar por `Error:` ou `TypeError:`

### Localmente
```bash
# Replicar o erro do CI localmente
npm ci  # instalar exatamente como no CI
npm run typecheck
npm run build
```

## 📝 Adicionar Novos Testes

Quando adicionar feature:
1. Testar manualmente em dev
2. Adicionar teste de tipo (TypeScript)
3. Testar build (`npm run build`)
4. Fazer PR e verificar CI verde
5. Testar manualmente em preview deploy

---

**Nota**: Testes unitários com Jest/Vitest podem ser adicionados futuramente.
