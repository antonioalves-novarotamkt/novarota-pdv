# 🚀 Deploy do Menu Manager

Guia passo a passo para colocar o sistema no ar com um link real, acessível de qualquer navegador.

O sistema tem duas partes que são hospedadas separadamente:
- **Backend + Banco de dados** → Railway
- **Frontend** → Vercel

## 1️⃣ Backend + Banco de Dados (Railway)

### Passo 1: Criar conta e projeto
1. Acesse [railway.app](https://railway.app) e entre com sua conta GitHub
2. Clique em **New Project** → **Deploy from GitHub repo**
3. Selecione o repositório `novarota-pdv`
4. Escolha a branch (a branch do PR, ou `main` depois de mergeado)

### Passo 2: Adicionar banco PostgreSQL
1. Dentro do projeto, clique em **+ New** → **Database** → **Add PostgreSQL**
2. O Railway cria automaticamente a variável `DATABASE_URL` e conecta ao banco

### Passo 3: Configurar o serviço do backend
1. Clique no serviço criado a partir do repositório (não no banco)
2. Vá em **Settings** → **Variables** e adicione:
   ```
   JWT_SECRET=<gere uma chave aleatória longa, ex: openssl rand -hex 32>
   NODE_ENV=production
   CORS_ORIGIN=<preencher depois, com a URL da Vercel>
   ```
3. Em **Settings** → **Networking**, clique em **Generate Domain** para obter uma URL pública (algo como `menu-manager-production.up.railway.app`)
4. O Railway detecta o `Dockerfile` na raiz automaticamente e faz o build

### Passo 4: Rodar o seed (dados de demonstração) — opcional
No painel do Railway, abra o terminal do serviço (**Settings** → **Deploy Logs** tem um botão de shell, ou use a CLI do Railway) e rode:
```bash
npm run seed -w backend
```

✅ **Anote a URL do backend** (ex: `https://menu-manager-production.up.railway.app`) — você vai precisar dela no próximo passo.

## 2️⃣ Frontend (Vercel)

### Passo 1: Criar projeto
1. Acesse [vercel.com](https://vercel.com) e entre com sua conta GitHub
2. Clique em **Add New** → **Project**
3. Selecione o repositório `novarota-pdv`
4. Em **Root Directory**, clique em **Edit** e selecione `frontend`

### Passo 2: Configurar variável de ambiente
Antes de clicar em Deploy, adicione a variável de ambiente:
```
VITE_API_URL=https://menu-manager-production.up.railway.app/api
```
(substitua pela URL real do backend que você anotou no passo anterior)

### Passo 3: Deploy
1. Clique em **Deploy**
2. Aguarde o build terminar (leva ~1-2 minutos)
3. A Vercel te dá uma URL pública, ex: `https://novarota-pdv.vercel.app`

### Passo 4: Atualizar CORS no backend
Volte no Railway e atualize a variável `CORS_ORIGIN` do backend com a URL real da Vercel:
```
CORS_ORIGIN=https://novarota-pdv.vercel.app
```
O Railway vai reiniciar o serviço automaticamente.

### Passo 5: Email para "Esqueci minha senha"
No serviço do backend, adicione as variáveis de SMTP. Os nomes são os mesmos do NovaRotaAdm, então dá para copiar os valores de lá:
```
APP_URL=https://novarota-pdv.vercel.app
EMAIL_SERVER_HOST=smtp.seuprovedor.com.br
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=usuario@seudominio.com.br
EMAIL_SERVER_PASSWORD=senha-do-email
EMAIL_FROM=Cardápio NovaRota <nao-responda@seudominio.com.br>
```
`APP_URL` é o endereço do frontend usado no link do email. Sem essas variáveis o sistema funciona normalmente, mas o email de redefinição de senha não é enviado.

## ✅ Pronto!

Acesse a URL da Vercel no navegador. Você deve ver a tela de login.

**Credenciais de teste** (se rodou o seed):
```
Email: demo@example.com
Senha: demo123
```

## 🔄 Deploys futuros

Toda vez que você (ou eu) fizer push na branch conectada, tanto Railway quanto Vercel fazem **deploy automático** — não precisa repetir esses passos.

## 🐛 Troubleshooting

**Erro de CORS no navegador (bloqueado por política CORS)**
→ Confira se `CORS_ORIGIN` no Railway é exatamente igual à URL da Vercel (sem barra `/` no final).

**Erro "Network Error" ao fazer login**
→ Confira se `VITE_API_URL` na Vercel aponta para a URL certa do Railway, terminando em `/api`.

**Erro 500 ao fazer login/registrar**
→ Verifique se as migrations rodaram. No Railway, veja os **Deploy Logs** — deve aparecer "All migrations have been successfully applied."

**Preciso trocar o JWT_SECRET depois**
→ Isso invalida todos os tokens ativos (todo mundo precisa logar de novo), mas é seguro fazer a qualquer momento.
