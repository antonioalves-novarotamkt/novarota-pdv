# NovaRota Delivery

Site publico de pedidos online (delivery) para uma loja/restaurante: cardapio, carrinho, calculo de
frete por distancia (raio + faixas de taxa) e pagamento na entrega. Os pedidos ficam disponiveis para o
**NovaRota PDV** (a app desktop na raiz deste repositorio) puxar automaticamente via sincronizacao.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL (hospedar em Vercel Postgres, Neon ou Supabase — qualquer Postgres serve)
- Geocodificacao gratuita via Nominatim/OpenStreetMap (endereco → coordenadas) + distancia em linha reta
  (haversine) para estimar a taxa de entrega

## Rodando localmente

```bash
cp .env.example .env   # preencha DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET, PDV_SYNC_TOKEN
npm install
npm run db:push        # cria as tabelas no Postgres configurado
npm run dev
```

Acesse `http://localhost:3000` para a pagina de pedidos, e `http://localhost:3000/admin` para o painel
(cadastro de produtos e configuracao de frete).

## Deploy (Vercel)

1. Crie um banco Postgres (Vercel Postgres, [Neon](https://neon.tech) ou [Supabase](https://supabase.com)
   tem planos gratuitos suficientes para comecar).
2. Crie um projeto na Vercel apontando para a pasta `delivery-web/` deste repositorio (em
   Project Settings → Root Directory).
3. Configure as variaveis de ambiente do projeto na Vercel: `DATABASE_URL`, `ADMIN_PASSWORD`,
   `SESSION_SECRET`, `PDV_SYNC_TOKEN` (gere valores aleatorios para os dois ultimos, ex:
   `openssl rand -hex 24`).
4. Deploy. O script `vercel-build` ja roda `prisma db push` automaticamente a cada deploy, criando/
   atualizando as tabelas no Postgres configurado — nao precisa rodar nada manualmente.
5. Acesse `/admin`, entre com `ADMIN_PASSWORD` e cadastre o cardapio e o endereco da loja.

## Como os pedidos chegam no PDV

O PDV desktop (pasta raiz do repo) faz *polling* periodico em `GET /api/pedidos/pendentes` (autenticado
com `PDV_SYNC_TOKEN` no header `Authorization: Bearer ...`), importa cada pedido novo como uma comanda do
tipo `delivery` (com endereco/telefone/observacoes anotados), e chama `POST /api/pedidos/:id/sincronizado`
para marcar como recebido. A partir dai, o fluxo e o mesmo de qualquer comanda: o operador confere os
itens, e ao entregar usa o botao "Cobrar" ja existente na tela Comandas para registrar o pagamento
(dinheiro/cartao na entrega) e emitir o cupom.

Configure a mesma URL (`https://seu-projeto.vercel.app`) e o mesmo `PDV_SYNC_TOKEN` em
**Configuracoes → Delivery** dentro do PDV desktop.

## Seguranca

`npm audit` acusa varias vulnerabilidades conhecidas do Next.js cujo fix definitivo e a major 15/16 (que
muda a API de rotas dinamicas e `cookies()`/`headers()` para assincrona — exigiria adaptar
`src/app/api/**/[id]/route.ts` e `src/lib/auth.ts`). Optei por manter a 14.2.35 (ultimo patch da serie 14)
para nao introduzir uma migracao maior sem testar, mas isso deve ser reavaliado antes de expor o site
publicamente com dados reais de clientes.

## Limitacoes atuais / proximos passos

- O catalogo de produtos do delivery e **separado** do catalogo do PDV (cadastrados em telas diferentes).
  Sincronizar os dois catálogos é um próximo passo natural.
- A distancia usada no calculo de frete é em linha reta (haversine), não é a distância real de rota. Para
  maior precisão trocar por uma API de rotas (Google Distance Matrix, OSRM).
- Pagamento é sempre na entrega (dinheiro ou cartão via maquininha). Pagamento online (Pix/cartão no site)
  exigiria integrar um gateway (Mercado Pago, Pagar.me, Stripe) — não implementado ainda.
- Painel admin usa uma senha única compartilhada, sem múltiplos usuários/permissões.
