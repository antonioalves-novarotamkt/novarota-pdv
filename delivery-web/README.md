# NovaRota Delivery

Site publico de pedidos online (delivery) para uma loja/restaurante: cardapio, carrinho, calculo de
frete por raio de distancia da loja (estilo iFood) e pagamento na entrega. Os pedidos ficam disponiveis
para o **NovaRota PDV** (a app desktop na raiz deste repositorio) puxar automaticamente via sincronizacao.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma + PostgreSQL (hospedar em Vercel Postgres, Neon ou Supabase — qualquer Postgres serve)
- [ViaCEP](https://viacep.com.br) (servico publico brasileiro gratuito, sem chave de API) para
  autopreencher rua/bairro/cidade a partir do CEP digitado pelo cliente
- [Mapbox](https://www.mapbox.com) (Geocoding API + mapa interativo) para converter o endereco
  confirmado em coordenadas, calcular a distancia ate a loja e exibir o mapa no admin e no checkout

## Areas de entrega (por raio, estilo iFood)

A taxa de entrega e definida por **camadas de raio** cadastradas em `/admin/areas-entrega`: cada
camada tem um raio em km, uma taxa e um tempo estimado proprios (ex: ate 1km = R$5/30min, ate 2km =
R$8/40min). O cliente paga a taxa da menor camada que alcance o endereco confirmado dele. A tela mostra
um mapa com a loja e os aneis de cada camada sobrepostos, alem de botoes de ajuste rapido (+/- min,
+/- R$) para editar cada camada — inspirado na tela de "Configuracoes de entrega" do portal do parceiro
iFood.

No checkout, depois do CEP + numero, o site geocodifica o endereco completo e mostra um mapa com o pino
da localizacao para o cliente confirmar antes de calcular a taxa final (assim como o MenuDino faz).

## Configurando o Mapbox

1. Crie uma conta gratuita em [mapbox.com](https://account.mapbox.com/auth/signup/) (nao pede cartao de
   credito para o tier gratuito, que cobre 50 mil carregamentos de mapa/mes).
2. Va em **Tokens** no painel da Mapbox e copie o "Default public token" (comeca com `pk.`).
3. Configure as variaveis `MAPBOX_TOKEN` e `NEXT_PUBLIC_MAPBOX_TOKEN` (mesmo valor nas duas) no `.env`
   local ou nas variaveis de ambiente da Vercel.

Sem o token configurado, o mapa mostra uma mensagem explicando o que falta, e o calculo de frete retorna
um erro claro em vez de quebrar a pagina.

## Rodando localmente

```bash
cp .env.example .env   # preencha DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET, PDV_SYNC_TOKEN, MAPBOX_TOKEN
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
   `openssl rand -hex 24`), `MAPBOX_TOKEN` e `NEXT_PUBLIC_MAPBOX_TOKEN` (veja "Configurando o Mapbox"
   acima).
4. Deploy. O script `vercel-build` ja roda `prisma db push` automaticamente a cada deploy, criando/
   atualizando as tabelas no Postgres configurado — nao precisa rodar nada manualmente.
5. Acesse `/admin`, entre com `ADMIN_PASSWORD`, preencha o endereco da loja em Configuracoes (isso
   geocodifica a origem do calculo de raio), cadastre o cardapio (ou aguarde a sincronizacao do PDV) e
   cadastre pelo menos uma camada de raio em `/admin/areas-entrega` — sem isso nenhum endereco consegue
   finalizar pedido.

## Como os pedidos chegam no PDV

O PDV desktop (pasta raiz do repo) faz *polling* periodico em `GET /api/pedidos/pendentes` (autenticado
com `PDV_SYNC_TOKEN` no header `Authorization: Bearer ...`), importa cada pedido novo como uma comanda do
tipo `delivery` (com endereco/telefone/observacoes anotados), e chama `POST /api/pedidos/:id/sincronizado`
para marcar como recebido. A partir dai, o fluxo e o mesmo de qualquer comanda: o operador confere os
itens, e ao entregar usa o botao "Cobrar" ja existente na tela Comandas para registrar o pagamento
(dinheiro/cartao na entrega) e emitir o cupom.

Configure a mesma URL (`https://seu-projeto.vercel.app`) e o mesmo `PDV_SYNC_TOKEN` em
**Configuracoes → Delivery** dentro do PDV desktop.

## Catalogo de produtos

O PDV desktop e a fonte da verdade do cardapio: em Produtos, cada item tem um checkbox "Delivery
Online" (aba Principal). A cada sincronizacao, o PDV envia (`POST /api/produtos/sync`) todos os
produtos marcados, e eles aparecem automaticamente no cardapio publico e em `/admin/produtos` com a
marcação **via PDV**. Produtos cadastrados manualmente aqui no painel (sem passar pelo PDV) continuam
funcionando normalmente — a sincronizacao so mexe nos que tem essa marcação.

## Seguranca

`npm audit` acusa varias vulnerabilidades conhecidas do Next.js cujo fix definitivo e a major 15/16 (que
muda a API de rotas dinamicas e `cookies()`/`headers()` para assincrona — exigiria adaptar
`src/app/api/**/[id]/route.ts` e `src/lib/auth.ts`). Optei por manter a 14.2.35 (ultimo patch da serie 14)
para nao introduzir uma migracao maior sem testar, mas isso deve ser reavaliado antes de expor o site
publicamente com dados reais de clientes.

## Limitacoes atuais / proximos passos

- As camadas de entrega sao aneis concentricos (raio em linha reta da loja), nao poligonos desenhados a
  mao no mapa como o "Personalizar areas" do iFood permite. Cobre bem a maioria dos casos, mas nao da
  pra excluir uma rua especifica dentro do raio, por exemplo.
- A distancia e em linha reta (haversine), nao a distancia real de rota — um raio de 2km pode, na
  pratica, ser uma rota de carro mais longa dependendo da regiao.
- Nao ha combos/modificadores de produto (ex: "escolha o sabor", com preco adicional por opcao) nem
  promocoes (preco riscado) — vistos em referencias como MenuDino, ficam como proximo passo.
- Pagamento é sempre na entrega (dinheiro ou cartão via maquininha). Pagamento online (Pix/cartão no site)
  exigiria integrar um gateway (Mercado Pago, Pagar.me, Stripe) — não implementado ainda.
- Painel admin usa uma senha única compartilhada, sem múltiplos usuários/permissões nem login de cliente
  (conta, histórico de pedidos, endereço salvo).
